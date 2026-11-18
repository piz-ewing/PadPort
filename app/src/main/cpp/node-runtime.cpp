#include <jni.h>
#include <node.h>
#include <v8.h>
#include <uv.h>
#include <string>
#include <vector>
#include <deque>
#include <mutex>
#include <fcntl.h>
#include <cerrno>

namespace {
JavaVM* vm;
jobject service;
jmethodID requestMethod;
jmethodID messageMethod;
struct Control {
    uv_async_t async;
    v8::Isolate* isolate;
    v8::Global<v8::Context> context;
    v8::Global<v8::Function> callback;
    std::deque<std::pair<std::u16string, bool>> pending;
};
std::mutex controlMutex;
Control* control = nullptr;

void drainControl(uv_async_t* handle) {
    auto* current = static_cast<Control*>(handle->data);
    std::deque<std::pair<std::u16string, bool>> pending;
    {
        std::lock_guard<std::mutex> lock(controlMutex);
        pending.swap(current->pending);
    }
    auto* isolate = current->isolate;
    v8::HandleScope scope(isolate);
    auto context = current->context.Get(isolate);
    v8::Context::Scope contextScope(context);
    for (const auto& item : pending) {
        auto value = v8::String::NewFromTwoByte(isolate, reinterpret_cast<const uint16_t*>(item.first.data()),
            v8::NewStringType::kNormal, static_cast<int>(item.first.size())).ToLocalChecked();
        v8::Local<v8::Value> arguments[] = {value};
        if (node::MakeCallback(isolate, context->Global(), current->callback.Get(isolate), 1, arguments, {0, 0}).IsEmpty()) return;
    }
}

void onControl(const v8::FunctionCallbackInfo<v8::Value>& args) {
    auto* isolate = args.GetIsolate();
    if (args.Length() != 1 || !args[0]->IsFunction()) {
        isolate->ThrowException(v8::Exception::TypeError(v8::String::NewFromUtf8Literal(isolate, "Expected a control callback")));
        return;
    }
    std::lock_guard<std::mutex> lock(controlMutex);
    if (control != nullptr) {
        isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8Literal(isolate, "Control callback already registered")));
        return;
    }
    auto* current = new Control();
    current->isolate = isolate;
    current->context.Reset(isolate, isolate->GetCurrentContext());
    current->callback.Reset(isolate, args[0].As<v8::Function>());
    int status = uv_async_init(node::GetCurrentEventLoop(isolate), &current->async, drainControl);
    if (status != 0) {
        delete current;
        isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate, uv_strerror(status)).ToLocalChecked()));
        return;
    }
    current->async.data = current;
    uv_unref(reinterpret_cast<uv_handle_t*>(&current->async));
    control = current;
    node::AddEnvironmentCleanupHook(isolate, [](void* value) {
        auto* current = static_cast<Control*>(value);
        {
            std::lock_guard<std::mutex> lock(controlMutex);
            control = nullptr;
        }
        current->callback.Reset();
        current->context.Reset();
        uv_close(reinterpret_cast<uv_handle_t*>(&current->async), [](uv_handle_t* handle) {
            delete static_cast<Control*>(handle->data);
        });
    }, current);
}

jstring javaString(JNIEnv* env, v8::Isolate* isolate, v8::Local<v8::String> value) {
    v8::String::Value chars(isolate, value);
    return env->NewString(reinterpret_cast<const jchar*>(*chars), chars.length());
}

void callJava(const v8::FunctionCallbackInfo<v8::Value>& args, jmethodID method, bool returnsValue) {
    auto* isolate = args.GetIsolate();
    if (args.Length() != 1 || !args[0]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(v8::String::NewFromUtf8Literal(isolate, "Expected one string argument")));
        return;
    }
    JNIEnv* env = nullptr;
    vm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6);
    jstring input = javaString(env, isolate, args[0].As<v8::String>());
    jobject result = nullptr;
    if (returnsValue) result = env->CallObjectMethod(service, method, input);
    else env->CallVoidMethod(service, method, input);
    env->DeleteLocalRef(input);
    if (env->ExceptionCheck()) {
        env->ExceptionDescribe();
        env->ExceptionClear();
        isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8Literal(isolate, "Android runtime callback failed")));
        return;
    }
    if (returnsValue) {
        auto text = static_cast<jstring>(result);
        const jchar* chars = env->GetStringChars(text, nullptr);
        auto value = v8::String::NewFromTwoByte(isolate, reinterpret_cast<const uint16_t*>(chars),
            v8::NewStringType::kNormal, env->GetStringLength(text)).ToLocalChecked();
        env->ReleaseStringChars(text, chars);
        env->DeleteLocalRef(text);
        args.GetReturnValue().Set(value);
    }
}

void request(const v8::FunctionCallbackInfo<v8::Value>& args) { callJava(args, requestMethod, true); }
void message(const v8::FunctionCallbackInfo<v8::Value>& args) { callJava(args, messageMethod, false); }

void initialize(v8::Local<v8::Object> exports, v8::Local<v8::Value>, v8::Local<v8::Context> context, void*) {
    NODE_SET_METHOD(exports, "request", request);
    NODE_SET_METHOD(exports, "message", message);
    NODE_SET_METHOD(exports, "onControl", onControl);
}
NODE_MODULE_LINKED(padport, initialize)
}

extern "C" JNIEXPORT jboolean JNICALL
Java_pl_padport_app_NodeService_dispatch(JNIEnv* env, jobject, jstring value, jboolean snapshot) {
    const jchar* chars = env->GetStringChars(value, nullptr);
    if (chars == nullptr) return JNI_FALSE;
    std::u16string text(reinterpret_cast<const char16_t*>(chars), env->GetStringLength(value));
    env->ReleaseStringChars(value, chars);
    std::lock_guard<std::mutex> lock(controlMutex);
    if (control == nullptr) return JNI_FALSE;
    if (snapshot && !control->pending.empty() && control->pending.back().second)
        control->pending.back().first = std::move(text);
    else control->pending.emplace_back(std::move(text), snapshot);
    return uv_async_send(&control->async) == 0 ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT void JNICALL
Java_pl_padport_app_GameDocuments_setAppend(JNIEnv* env, jclass, jint fd) {
    int flags = fcntl(fd, F_GETFL);
    if (flags != -1 && fcntl(fd, F_SETFL, flags | O_APPEND) != -1) return;
    int error = errno;
    jclass type = env->FindClass("android/system/ErrnoException");
    jmethodID constructor = env->GetMethodID(type, "<init>", "(Ljava/lang/String;I)V");
    jstring function = env->NewStringUTF("fcntl");
    auto exception = static_cast<jthrowable>(env->NewObject(type, constructor, function, error));
    env->Throw(exception);
    env->DeleteLocalRef(exception);
    env->DeleteLocalRef(function);
    env->DeleteLocalRef(type);
}

extern "C" JNIEXPORT jint JNICALL
Java_pl_padport_app_NodeService_run(JNIEnv* env, jobject instance, jobjectArray arguments) {
    env->GetJavaVM(&vm);
    service = env->NewGlobalRef(instance);
    jclass type = env->GetObjectClass(instance);
    requestMethod = env->GetMethodID(type, "request", "(Ljava/lang/String;)Ljava/lang/String;");
    messageMethod = env->GetMethodID(type, "message", "(Ljava/lang/String;)V");
    env->DeleteLocalRef(type);
    const jsize count = env->GetArrayLength(arguments);
    std::vector<std::string> values;
    size_t length = 0;
    for (jsize i = 0; i < count; i++) {
        auto arg = static_cast<jstring>(env->GetObjectArrayElement(arguments, i));
        const char* chars = env->GetStringUTFChars(arg, nullptr);
        values.emplace_back(chars);
        length += values.back().size() + 1;
        env->ReleaseStringUTFChars(arg, chars);
        env->DeleteLocalRef(arg);
    }
    std::vector<char> storage(length);
    std::vector<char*> argv;
    char* current = storage.data();
    for (const auto& value : values) {
        value.copy(current, value.size());
        current[value.size()] = '\0';
        argv.push_back(current);
        current += value.size() + 1;
    }
    argv.push_back(nullptr);
    int result = node::Start(count, argv.data());
    env->DeleteGlobalRef(service);
    service = nullptr;
    return result;
}
