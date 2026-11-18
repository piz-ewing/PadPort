'use strict';

function installPlatformModules({require, requireCache, Buffer, process}) {
    let greenworks = {};
    requireCache.greenworks = greenworks;
    greenworks.activateAchievement = function (achievement, success_callback, error_callback) {
        if (success_callback) {
            success_callback();
        }
        return true;
    }
    greenworks.indicateAchievementProgress = function (achievement, current, max, success_callback, error_callback) {
        if (success_callback) {
            success_callback();
        }
        return true;
    }
    greenworks.getAchievement = function (achievement, success_callback, error_callback) {
        if (success_callback) {
            success_callback(true);
        }
        return true;
    }
    greenworks.clearAchievement = function (achievement, success_callback, error_callback) {
        if (success_callback) {
            success_callback();
        }
        return true;
    }
    greenworks.getAchievementNames = function () {
        return [];
    }
    greenworks.getNumberOfAchievements = function () {
        return 0;
    }
    greenworks.getAuthSessionTicket = function (success_callback, error_callback) {
        const ticket = {ticket: Buffer.from("getAuthSessionTicket"), handle: 100};
        if (success_callback) success_callback(ticket);
        return ticket;
    }
    greenworks.cancelAuthTicket = function (ticket_handle) {
        return true;
    }
    greenworks.getEncryptedAppTicket = function (user_data, success_callback, error_callback) {
        if (success_callback) {
            success_callback(Buffer.from("getAuthSessionTicket"));
        }
        return true;
    }
    greenworks.decryptAppTicket = function (encrypted_ticket, decryption_key) {
        return Buffer.from("getAuthSessionTicket");
    }
    greenworks.isTicketForApp = function (decrypted_ticket, app_id) {
        return true;
    }
    greenworks.getTicketIssueTime = function (decrypted_ticket) {
        return Math.floor(Date.now() / 1000);
    }

    function returnSteamID() {
        let ret = {};
        ret.isAnonymous = function () {
            return false;
        }
        ret.isAnonymousGameServer = function () {
            return false;
        }
        ret.isAnonymousGameServerLogin = function () {
            return false;
        }
        ret.isAnonymousUser = function () {
            return false;
        }
        ret.isChatAccount = function () {
            return false;
        }
        ret.isClanAccount = function () {
            return false;
        }
        ret.isConsoleUserAccount = function () {
            return false;
        }
        ret.isContentServerAccount = function () {
            return false;
        }
        ret.isGameServerAccount = function () {
            return false;
        }
        ret.isIndividualAccount = function () {
            return true;
        }
        ret.isPersistentGameServerAccount = function () {
            return false;
        }
        ret.isLobby = function () {
            return false;
        }
        ret.getAccountID = function () {
            return 1234567890;
        }
        ret.getRawSteamID = function () {
            return "012345678901234567890123456789";
        }
        ret.getAccountType = function () {
            return 1;
        }
        ret.isValid = function () {
            return true;
        }
        ret.getStaticAccountKey = function () {
            return "012345678901234567890123456789";
        }
        ret.getPersonaName = function () {
            return "Player";
        }
        ret.getNickname = function () {
            return "Player";
        }
        ret.getRelationship = function () {
            return {};
        }
        ret.getSteamLevel = function () {
            return 1;
        }
        return ret;
    }

    greenworks.getTicketSteamId = function (decrypted_ticket) {
        return returnSteamID();
    }
    greenworks.saveTextToFile = function (file_name, file_content, success_callback, error_callback) {
        try {
            let fs = require("fs");
            if (!fs.existsSync("steamSaveFiles")) {
                fs.mkdirSync("steamSaveFiles");
            }
            fs.writeFileSync("steamSaveFiles/" + file_name, file_content);
            if (success_callback) {
                success_callback();
            }
        } catch (e) {
            if (error_callback) {
                error_callback(e);
            }
        }
        return false;
    }
    greenworks.readTextFromFile = function (file_name, success_callback, error_callback) {
        try {
            if (success_callback) {
                success_callback(require("fs").readFileSync("steamSaveFiles/" + file_name, "utf8"));
            }
        } catch (e) {
            if (error_callback) {
                error_callback(e);
            }
        }
        return false;
    }
    greenworks.deleteFile = function (file_name, success_callback, error_callback) {
        try {
            require("fs").unlinkSync("steamSaveFiles/" + file_name)
        } catch (e) {
        }
        if (success_callback) {
            success_callback();
        }
        return false;
    }
    greenworks.saveFilesToCloud = function (file_name, success_callback, error_callback) {
        if (success_callback) {
            success_callback();
        }
        return false;
    }
    greenworks.isCloudEnabledForUser = function () {
        return true;
    }
    greenworks.isCloudEnabled = function () {
        return true;
    }
    greenworks.enableCloud = function () {
        return true;
    }
    greenworks.getCloudQuota = function (success_callback, error_callback) {
        if (success_callback) {
            success_callback({
                total_bytes: 9999999,
                available_bytes: 9999999
            });
        }
        return true;
    }
    greenworks.getFileCount = function (success_callback, error_callback) {
        try {
            return require("fs").readdirSync("steamSaveFiles").length;
        } catch (e) {

        }
        return 0;
    }
    greenworks.getFileNameAndSize = function (index) {
        let fs = require("fs");
        let files = fs.readdirSync("steamSaveFiles");
        let stat = fs.statSync("steamSaveFiles/" + files[index]);
        return {
            name: files[index],
            size: stat.size
        };
    }
    greenworks.getDLCCount = function () {
        return 0;
    }
    greenworks.getDLCDataByIndex = function (index) {
        return {
            appId: 0,
            available: true,
            name: ""
        };
    }
    greenworks.isDLCInstalled = function (dlc_app_id) {
        return true;
    }
    greenworks.installDLC = function (dlc_app_id) {
        return true;
    }
    greenworks.uninstallDLC = function (dlc_app_id) {
        return true;
    }
    greenworks.on = function (evtype, callback) {
        return true;
    }

    greenworks.FriendFlags = {
        None: 0,
        Blocked: 1,
        FriendshipRequested: 2,
        Immediate: 3,
        ClanMember: 4,
        OnGameServer: 5,
        RequestingFriendship: 6,
        RequestingInfo: 7,
        Ignored: 8,
        IgnoredFriend: 9,
        ChatMember: 10,
        All: 11
    }
    greenworks.FriendRelationship = {
        None: 0,
        Blocked: 1,
        RequestRecipient: 2,
        Friend: 3,
        RequestInitiator: 4,
        Ignored: 5,
        IgnoredFriend: 6
    }
    greenworks.PersonaChange = {
        Name: 0,
        Status: 1,
        ComeOnline: 2,
        GoneOffline: 3,
        GamePlayed: 4,
        GameServer: 5,
        Avatar: 6,
        JoinedSource: 7,
        LeftSource: 8,
        RelationshipChanged: 9,
        NameFirstSet: 10,
        FacebookInfo: 11,
        NickName: 12,
        SteamLevel: 13
    }
    greenworks.AccountType = {
        Invalid: 0,
        Individual: 1,
        Multiseat: 2,
        GameServer: 3,
        AnonymousGameServer: 4,
        Pending: 5,
        ContentServer: 6,
        Clan: 7,
        Chat: 8,
        ConsoleUser: 9,
        AnonymousUser: 10
    }
    greenworks.ChatEntryType = {
        Invalid: 0,
        ChatMsg: 1,
        Typing: 2,
        InviteGame: 3,
        Emote: 4,
        LeftConversation: 5,
        Entered: 6,
        WasKicked: 7,
        WasBanned: 8,
        Disconnected: 9,
        HistoricalChat: 10,
        LinkBlocked: 11
    }
    greenworks.getFriendsAccount = function (friend_flag) {
        return 1;
    }
    greenworks.getFriendsAccount = function (getFriends) {
        return [returnSteamID()];
    }
    greenworks.requestUserInformation = function (raw_steam_id, require_name_only) {
        return returnSteamID();
    }
    greenworks.getSmallFriendAvatar = function (raw_steam_id) {
        return 0;
    }
    greenworks.getMediumFriendAvatar = function (raw_steam_id) {
        return 0;
    }
    greenworks.getLargeFriendAvatar = function (raw_steam_id) {
        return 0;
    }
    greenworks.setListenForFriendsMessage = function (intecept_enabled) {
        return 0;
    }
    greenworks.replyToFriendMessage = function (raw_steam_id, message) {
        return true;
    }
    greenworks.getFriendMessage = function (raw_steam_id, message_id, maximum_message_size) {
        return "dummy_getFriendMessage";
    }
    greenworks.getFriendPersonaName = function (raw_steam_id) {
        return "dummy_getFriendPersonaName";
    }
    greenworks.setRichPresence = function (pchKey, pchValue) {
        return false;
    }
    greenworks.ClearRichPresence = function () {
        return false;
    }
    greenworks.getFriendRichPresence = function (steamIDFriend, pchKey) {
        return "dummy_getFriendRichPresence";
    }
    greenworks.setPlayedWith = function (steamIDUserPlayedWith) {
        return true;
    }
    greenworks.getFriendGamePlayed = function (steamIDFriend) {
        return undefined;
    }
    greenworks.activateGameOverlayInviteDialog = function (steamIDLobby) {
        return undefined;
    }
    greenworks.activateGameOverlayToUser = function (pchDialog, steamID) {
        return undefined;
    }
    greenworks.ChatMemberStateChange = {
        Entered: 0,
        Left: 1,
        Disconnected: 2,
        Kicked: 3,
        Banned: 4
    }
    greenworks.LobbyComparison = {
        EqualToOrLessThan: 0,
        LessThan: 1,
        Equal: 2,
        GreaterThan: 3,
        EqualToOrGreaterThan: 4,
        NotEqual: 4
    }
    greenworks.LobbyDistanceFilter = {
        Close: 0,
        Default: 1,
        Far: 2,
        Worldwide: 3
    }
    greenworks.LobbyDistanceFilter = {
        Private: 0,
        FriendsOnly: 1,
        Public: 2,
        Invisible: 3
    }
    greenworks.Result = {
        OK: 0,
        Fail: 1,
        NoConnection: 2,
        InvalidPassword: 3,
        LoggedInElsewhere: 4,
        InvalidProtocolVer: 5,
        InvalidParam: 6,
        FileNotFound: 7,
        Busy: 8,
        InvalidState: 9,
        InvalidName: 10,
        InvalidEmail: 11,
        DuplicateName: 12,
        AccessDenied: 13,
        Timeout: 14,
        Banned: 15,
        AccountNotFound: 16,
        InvalidSteamID: 17,
        ServiceUnavailable: 18,
        NotLoggedOn: 19,
        Pending: 20,
        EncryptionFailure: 21,
        InsufficientPrivilege: 22,
        LimitExceeded: 23,
        Revoked: 24,
        Expired: 25,
        AlreadyRedeemed: 26,
        DuplicateRequest: 27,
        AlreadyOwned: 28,
        IPNotFound: 29,
        PersistFailed: 30,
        LockingFailed: 31,
        LogonSessionReplaced: 32,
        ConnectFailed: 33,
        HandshakeFailed: 34,
        IOFailure: 35,
        RemoteDisconnect: 36,
        ShoppingCartNotFound: 37,
        Blocked: 38,
        Ignored: 39,
        NoMatch: 40,
        AccountDisabled: 41,
        ServiceReadOnly: 42,
        AccountNotFeatured: 43,
        AdministratorOK: 44,
        ContentVersion: 45,
        TryAnotherCM: 46,
        PasswordRequiredToKickSession: 47,
        AlreadyLoggedInElsewhere: 48,
        Suspended: 49,
        Cancelled: 50,
        DataCorruption: 51,
        DiskFull: 52,
        RemoteCallFailed: 53,
        PasswordUnset: 54,
        ExternalAccountUnlinked: 55,
        PSNTicketInvalid: 56,
        ExternalAccountAlreadyLinked: 57,
        RemoteFileConflict: 58,
        IllegalPassword: 59,
        SameAsPreviousValue: 60,
        AccountLogonDenied: 61,
        CannotUseOldPassword: 62,
        InvalidLoginAuthCode: 63,
        AccountLogonDeniedNoMail: 64,
        HardwareNotCapableOfIPT: 65,
        IPTInitError: 66,
        ParentalControlRestricted: 67,
        FacebookQueryError: 68,
        ExpiredLoginAuthCode: 69,
        IPLoginRestrictionFailed: 70,
        AccountLockedDown: 71,
        AccountLogonDeniedVerifiedEmailRequired: 72,
        NoMatchingURL: 73,
        BadResponse: 74,
        RequirePasswordReEntry: 75,
        ValueOutOfRange: 76,
        UnexpectedError: 77,
        Disabled: 78,
        InvalidCEGSubmission: 79,
        RestrictedDevice: 80,
        RegionLocked: 81,
        RateLimitExceeded: 82,
        AccountLoginDeniedNeedTwoFactor: 83,
        ItemDeleted: 84,
        AccountLoginDeniedThrottle: 85,
        TwoFactorCodeMismatch: 86,
        TwoFactorActivationCodeMismatch: 87,
        AccountAssociatedToMultiplePartners: 88,
        NotModified: 89,
        NoMobileDevice: 90,
        TimeNotSynced: 91,
        SmsCodeFailed: 92,
        AccountLimitExceeded: 93,
        AccountActivityLimitExceeded: 94,
        PhoneActivityLimitExceeded: 95,
        RefundToWallet: 96,
        EmailSendFailure: 97,
        NotSettled: 98,
        NeedCaptcha: 99,
        GSLTDenied: 100,
        GSOwnerDenied: 101,
        InvalidItemType: 102,
        IPBanned: 103,
        GSLTExpired: 104,
        InsufficientFunds: 105,
        TooManyPending: 106
    };
    greenworks.createLobby = function (lobbyType, maxMembers) {
        return greenworks.Result.OK;
    }
    greenworks.deleteLobbyData = function (steamIDLobby, pchKey) {
        return true;
    }
    greenworks.getLobbyByIndex = function (index) {
        return "dummy_getLobbyByIndex";
    }
    greenworks.getLobbyMemberByIndex = function (steamIDLobby, iMember) {
        return "dummy_getLobbyMemberByIndex";
    }
    greenworks.getNumLobbyMembers = function (steamIDLobby) {
        return 0;
    }
    greenworks.getNumLobbyMembers = function (steamIDLobby) {
        return "dummy_getNumLobbyMembers";
    }
    greenworks.inviteUserToLobby = function (steamIDLobby, steamIDInvitee) {
        return false;
    }
    greenworks.joinLobby = function (steamIDLobby) {
        return greenworks.Result.Fail;
    }
    greenworks.leaveLobby = function (steamIDLobby) {
        return greenworks.Result.OK;
    }
    greenworks.setLobbyData = function (steamIDLobby, pchKey, pchValue) {
        return true;
    }
    greenworks.setLobbyJoinable = function (steamIDLobby, bLobbyJoinable) {
        return true;
    }
    greenworks.setLobbyOwner = function (steamIDLobby, steamIDNewOwner) {
        return true;
    }
    greenworks.setLobbyOwner = function (steamIDLobby, eLobbyType) {
        return true;
    }
    greenworks.initAPI = function () {
        return true;
    }
    greenworks.init = function () {
        return true;
    }
    greenworks.isSteamRunning = function () {
        return true;
    }
    greenworks.isSteamRunningOnSteamDeck = function () {
        return false;
    }
    greenworks.restartAppIfNecessary = function (appId) {
        return false;
    }
    greenworks.getAppId = function () {
        return 0;
    }
    greenworks.getAppBuildId = function () {
        return 0;
    }
    greenworks.getSteamId = function () {
        return returnSteamID();
    }
    greenworks.getCurrentGameLanguage = function () {
        return "zh-CN";
    }
    greenworks.getCurrentUILanguage = function () {
        return "zh-CN";
    }
    greenworks.getCurrentGameInstallDir = function () {
        return process.cwd();
    }
    greenworks.getAppInstallDir = function (app_id, buffer, buffer_size) {
        return process.cwd();
    }
    greenworks.getNumberOfPlayers = function (success_callback, error_callback) {
        if (success_callback) {
            success_callback(1);
        }
        return true;
    }
    greenworks.activateGameOverlay = function (option) {
        return true;
    }
    greenworks.isGameOverlayEnabled = function () {
        return false;
    }
    greenworks.isSteamInBigPictureMode = function () {
        return false;
    }
    greenworks.activateGameOverlayToWebPage = function (url) {
        return false;
    }
    greenworks.activateGameOverlayToWebPage = function (appId, storeFlag) {
        return false;
    }
    greenworks.isSubscribedApp = function (appId) {
        return true;
    }
    greenworks.isAppInstalled = function (appId) {
        return true;
    }
    greenworks.getImageSize = function (handle) {
        return {
            width: 0,
            height: 0
        };
    }
    greenworks.getImageRGBA = function (handle) {
        return Buffer.alloc(0);
    }
    greenworks.getIPCountry = function (handle) {
        return "US";
    }
    greenworks.getLaunchCommandLine = function (handle) {
        return "";
    }
    greenworks.getStatInt = function (name) {
        return 0;
    }
    greenworks.getStatFloat = function (name) {
        return 0.0;
    }
    greenworks.setStat = function (name, value) {
        return true;
    }
    greenworks.storeStats = function (success_callback, error_callback) {
        if (success_callback) {
            success_callback();
        }
        return true;
    }
    greenworks.FloatingGamepadTextInputMode = 0;
    greenworks.showFloatingGamepadTextInput = function (keyboardMode, x, y, width, height) {
        return true;
    }
    greenworks.Utils = {};
    greenworks.Utils.move = function (source_dir, target_dir, success_callback, error_callback) {
        return true;
    }
    greenworks.Utils.createArchive = function (zip_file_path, source_dir, password, compress_level, success_callback, error_callback) {
        return true;
    }
    greenworks.Utils.extractArchive = function (zip_file_path, extract_dir, password, success_callback, error_callback) {
        return true;
    }
    greenworks.fileShare = function (file_path, success_callback, error_callback) {
        if (success_callback) {
            success_callback();
        }
        return true;
    }
    greenworks.publishWorkshopFile = function (options, file_path, image_path, title, description, success_callback, error_callback) {
        if (success_callback) {
            success_callback();
        }
        return true;
    }
    greenworks.updatePublishedWorkshopFile = function (options, published_file_handle, file_path, image_path, title, description, success_callback, error_callback) {
        if (success_callback) {
            success_callback();
        }
        return true;
    }
    greenworks.ugcPublish = function (file_path, title, description, image_path, success_callback, error_callback, progress_callback) {
        if (success_callback) {
            success_callback();
        }
        return true;
    }
    greenworks.ugcPublishUpdate = function (published_file_handle, file_path, title, description, image_path, success_callback, error_callback, progress_callback) {
        if (success_callback) {
            success_callback();
        }
        return true;
    }
    greenworks.ugcGetItems = function (options, ugc_matching_type, ugc_query_type, success_callback, error_callback) {
        if (success_callback) {
            success_callback([]);
        }
        return true;
    }
    greenworks.ugcGetUserItems = function (options, ugc_matching_type, ugc_list_sort_order, ugc_list, success_callback, error_callback) {
        if (success_callback) {
            success_callback([]);
        }
        return true;
    }
    greenworks.ugcDownloadItem = function (download_file_handle, download_dir, success_callback, error_callback) {
        if (success_callback) {
            success_callback();
        }
        return true;
    }
    greenworks.ugcSynchronizeItems = function (options, sync_dir, success_callback, error_callback) {
        if (success_callback) {
            success_callback([]);
        }
        return true;
    }
    greenworks.ugcUnsubscribe = function (published_file_handle, success_callback, error_callback) {
        if (success_callback) {
            success_callback([]);
        }
        return true;
    }
    greenworks.ugcShowOverlay = function (published_file_id) {
        return true;
    }
    greenworks.ugcGetItemState = function (published_file_id) {
        return 0;
    }
    greenworks.ugcGetItemInstallInfo = function (published_file_id) {
        return undefined;
    }
    greenworks._steam_events = {
        "on": function () {
        }
    };
    const greenworksKeys = Object.keys(greenworks);
    const greenworksProxy = new Proxy(greenworks, {
        get(target, prop, receiver) {
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value, receiver) {
            if (greenworksKeys.includes(prop)) {
                return true;
            }
            return Reflect.set(target, prop, value, receiver);
        }
    });

    requireCache['./lib/greenworks-osx64'] = greenworksProxy;
    requireCache['./lib/greenworks-osx32'] = greenworksProxy;
    requireCache['./lib/greenworks-win64'] = greenworksProxy;
    requireCache['./lib/greenworks-win32'] = greenworksProxy;
    requireCache['./lib/greenworks-linux64'] = greenworksProxy;
    requireCache['./lib/greenworks-linux32'] = greenworksProxy;
    let steamworksInitAppId = 0;
    const createMockLobby = (id) => ({
        id: BigInt(id),
        leave() { },
        openInviteDialog() { },
        getData() {
            return null;
        },
        setData() {
            return false;
        },
        setJoinable() {
            return false;
        },
        getMemberCount() {
            return 0;
        },
        getMemberLimit() {
            return 0;
        },
        getOwner() {
            return { steamId64: BigInt(0) };
        },
        getMembers() {
            return [];
        },
    });
    const createSteamworksApi = (appId) => ({
        achievement: {
            activate() { },
            clear() { },
            isActivated() {
                return false;
            },
        },
        localplayer: {
            getSteamId() {
                return { steamId64: BigInt(0) };
            },
            getName() {
                return "Player";
            },
            getIpCountry() {
                return "Unknown";
            },
            getLevel() {
                return 0;
            },
            setRichPresence() { },
        },
        utils: {
            getAppId() {
                return appId || steamworksInitAppId || 0;
            },
            getServerRealTime() {
                return Date.now();
            },
            isSteamRunningOnSteamDeck() {
                return false;
            },
        },
        matchmaking: {
            createLobby() {
                return Promise.resolve(createMockLobby(1));
            },
            getLobbies() {
                return Promise.resolve([]);
            },
            joinLobby(id) {
                return Promise.resolve(createMockLobby(id));
            },
        },
        apps: {
            isSubscribedApp() {
                return false;
            },
            isAppInstalled() {
                return false;
            },
            isDlcInstalled() {
                return false;
            },
            appInstallDir() {
                return "";
            },
            isVacBanned() {
                return false;
            },
            isLowViolence() {
                return false;
            },
            isSubscribed() {
                return false;
            },
            currentGameLanguage() {
                return "";
            },
            currentBetaName() {
                return "";
            },
            appBuildId() {
                return 0;
            },
        },
        cloud: {
            isEnabledForAccount() {
                return false;
            },
            isEnabledForApp() {
                return false;
            },
            readFile() {
                return "";
            },
            writeFile() {
                return false;
            },
            fileExists() {
                return false;
            },
            deleteFile() {
                return false;
            },
        },
        workshop: {
            createItem() {
                return Promise.reject(new Error("steamworks.js stub"));
            },
            updateItem() {
                return Promise.reject(new Error("steamworks.js stub"));
            },
            subscribe() {
                return Promise.reject(new Error("steamworks.js stub"));
            },
            unsubscribe() {
                return Promise.reject(new Error("steamworks.js stub"));
            },
            download() { },
            state() {
                return 0;
            },
            installInfo() {
                return null;
            },
            downloadInfo() {
                return null;
            },
        },
    });
    const steamworksJs = {
        electronEnableSteamOverlay() { },
        restartAppIfNecessary() {
            return false;
        },
        init(appId) {
            steamworksInitAppId = appId || 0;
            return createSteamworksApi(appId);
        },
    };
    requireCache["steamworks.js"] = steamworksJs;

    return {
        greenworks,
        steamworks: steamworksJs
    };
        
}

module.exports = {installPlatformModules};
