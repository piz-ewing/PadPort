# Refactoring status / 重构状态

Updated / 更新：2026-11-18

## Why refactor?

The refactoring focuses on four improvements:

- **Make more games playable** by fixing startup, resource, graphics, audio and
  input errors that previously prevented normal play.
- **Improve touch controls** with clearer layouts and direct joystick position
  and size editing.
- **Make play smoother** by reducing redundant file access, resource-loading
  overhead and blocking texture work.
- **Support ASAR games** by reading packaged MV/MZ resources on demand.

## Status

This is an experimental refactoring of PadPort. Validation has been limited to
local development and selected devices and games. Earlier test results and
successful builds do not establish stability across games, plugins, storage
providers or Android devices. Stability, performance and compatibility are not
guaranteed.

## Changes

- MV/MZ playback uses Android System WebView for rendering and audio, with a
  separate Node process for files, CommonJS modules and local resource services.
- Folder and ASAR resources use the runtime file layer. Electron-style packages
  have a compatibility layer for entry points, preload scripts and selected APIs.
- Fixes address connection cleanup, resource-loading pressure, bitmap callbacks,
  texture uploads, audio pause/resume, display requests and input release. Their
  presence does not mean every related symptom has been resolved.
- Touch controls include layout selection, direct joystick position/size editing,
  dragging origin and optional input prediction, disabled by default.
- The floating player menu exposes settings, diagnostics and optional live page
  debugging. Simplified Chinese UI and documentation are available.

## Removed or replaced

- Second-screen panels, settings and their dedicated resources have been removed.
- The GeckoView MV/MZ player has been replaced by System WebView. There is no
  browser-engine selector in the current player.
- MV/MZ uses the engine's file saves. The previous browser-save transfer actions
  are absent from the active MV/MZ menu; old browser storage is not migrated
  automatically. RGSS retains its separate native player and ZIP backups.
- Touch-down-generated joystick centers have been removed. The configured home
  position and optional dragging origin remain.

## Next steps

Bug fixes and touch responsiveness take priority in the next round of work:

- Continue fixing compatibility, stuttering, audio and resource-loading issues.
- Improve virtual button response during presses, slides, releases and multitouch,
  especially combined movement and action inputs.
- Add an in-game trainer for viewing and adjusting common game data.
- Reorganize the settings UI to make common options easier to find and use.

These items describe planned work, not completed features.

## Limits and reporting

The desktop Electron/Node API surface is incomplete, and Windows executables or
arbitrary desktop native modules are unsupported. ASAR contents are read-only;
saves require a writable location outside the archive. RGSS remains experimental.

Back up saves and verify saving/loading before a longer session. To report a
problem, [open an Issue](../../../issues/new) with the app version, Android and
WebView versions, device model, reproduction steps and a reviewed diagnostic log.
Explain whether it is intermittent and whether an earlier version worked. Do not
upload game assets, full game packages or personal save files to a public report.
See [Debugging](DEBUGGING.md) for collecting useful evidence.

## 中文说明

这次重构主要围绕四项改进：

- **修复大量游戏运行错误**：处理启动、资源、图形、音频和输入问题，让更多游戏能正常游玩。
- **更好看、更好用的虚拟控制器**：改进布局，直接拖动调整摇杆的位置和大小。
- **更流畅的游玩体验**：减少重复文件访问、资源加载开销及纹理处理阻塞，改善卡顿。
- **ASAR 游戏支持**：按需读取归档中的 MV/MZ 游戏资源，无需先解包整个归档。

本分支是 PadPort 的实验性重构版本。目前仅在本地开发环境及少量设备、游戏中
做过有限验证，构建成功或历史测试结果不代表各类游戏、插件、存储提供方和
Android 设备都能正常运行，**不保证稳定性、性能及兼容性**。

主要变化：MV/MZ 改用系统 WebView 渲染和播放音频，独立 Node 进程负责文件、模块
及本地资源服务；接入 ASAR 和部分 Electron 启动接口；修复了连接清理、资源加载、
位图回调、纹理上传、音频恢复、显示刷新率请求及输入释放等路径中的部分问题；
加入可直接拖动、缩放的摇杆编辑、边缘随动、可选输入预测、诊断及页面调试。
输入预测默认关闭。

移除了副屏功能及其资源、GeckoView 播放路径，以及按落点生成摇杆中心的功能。
MV/MZ 正常存档改用游戏引擎的文件存档，当前菜单不再提供旧的浏览器存档转换流程，
旧浏览器存档不会自动迁移。RGSS 保留独立原生播放器和 ZIP 存档备份。

这不是完整桌面 Electron/Node 环境，部分 API 和插件仍可能不兼容。ASAR 内部只读，
需要在归档外写入存档。建议试用前备份，并先检查保存、读取是否正常。

### 后续计划

后续优先修复问题和改善触控跟手性：

- 持续修复游戏兼容性、卡顿、音频及资源加载问题。
- 改善虚拟按键在按下、滑动、松开和多点触控时的响应，重点提升移动与攻击等组合操作的可靠性。
- 加入游戏内修改器，用于查看和调整常用游戏数据。
- 调整设置 UI 的分组、布局与操作流程，方便查找和使用常用选项。

以上是后续开发方向，尚未全部实现。

遇到问题欢迎[提交 Issue](../../../issues/new)，附应用、Android、WebView 版本、
设备型号、复现步骤及检查过的诊断日志，说明是否偶发、旧版是否正常。公开反馈
请勿附上游戏资源、完整游戏包或个人存档。诊断方法见[调试文档](DEBUGGING.md)。
