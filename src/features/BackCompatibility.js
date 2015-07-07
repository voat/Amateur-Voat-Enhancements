AVE.Modules['BackCompatibility'] = {
    ID: 'BackCompatibility',
    Name: 'BackCompatibility Module',
    Desc: 'Migrate data from V1 to V2.',
    Category: 'Misc.',

    Index: 200,
    Enabled: false,

    Options: {
    },

    Load: function () {
        this.GetV1DataStat();
    },

    Migrate: function (type) {
        if (type == "shortcuts") {
            if (GM_getValue("Voat_Subverses") == undefined) { return;}
            _this.Store.SetValue(AVE.Modules['Shortcuts'].StorageName, GM_getValue("Voat_Subverses"));
        } else if (type == "usertags") {
            if (GM_getValue("Voat_Tags") == undefined) { return; }
            var tags = GM_getValue("Voat_Tags").split(",");
            var opt, user, tag;
            for (var i in tags) {
                user = tags[i].split(":")[0];
                tag = tags[i].split(":")[1];
                if (tag == undefined) { continue;}

                opt = { username: user, tag: tag, colour: (AVE.Utils.CSSstyle == "dark" ? "#d1d1d1" : "#e1fcff"), ignore: false, balance: 0 };
                AVE.Modules['UserTag'].SetTag(opt);
            }
        }
    },

    DeleteOldData: function () {
        var prefNames = ["Voat_Subverses", "Voat_Tags", "Images", "Videos", "_this-texts", "MediaTypes", "ShowVersionChangeNotification"];
        $.each(prefNames, function (value) {
            if (GM_getValue(prefNames[value]) != undefined) {
                GM_deleteValue(prefNames[value]);
            } else {
                print(prefNames[value] + " doesn't exist.");
            }
        });
    },

    GetV1DataStat: function () {
        var ret = [0, 0, 0];
        if (GM_getValue("Voat_Subverses") != null) {
            ret[0] = GM_getValue("Voat_Subverses").split(",").length;
        }
        if (GM_getValue("Voat_Tags") != null) {
            ret[1] = GM_getValue("Voat_Tags").split(",").length - 1;
        }

        var prefNames = ["Images", "Videos", "_this-texts", "MediaTypes", "ShowVersionChangeNotification"];
        $.each(prefNames, function (value) {
            if (GM_getValue(prefNames[value]) != undefined) {
                ret[2]++;
            }
        });

        return ret;
    },

    AppendToPreferenceManager: {
        html: function () {
            var _this = AVE.Modules['BackCompatibility'];
            var s = _this.GetV1DataStat();
            var htmlStr = "";
            htmlStr += '<p>You have, stored from V1:<br />&nbsp;&nbsp;<b>' + s[0] + '</b> subverses/sets as your custom shortcuts.<br />&nbsp;&nbsp;<b>' + s[1] + '</b> tagged users.<br />&nbsp;&nbsp;<b>' + s[2] + '</b> module preferences.</p>';

            htmlStr += '<input module="shortcuts" style="font-weight:bold;margin-top:20px;" value="Migrate old shortcuts data" id="MigrateV1Data" class="btn-whoaverse-paging btn-xs btn-default" type="submit"></input><input style="margin-left:25px;font-weight:bold;" value="Clear old data" id="ClearAllV1Data" class="btn-whoaverse-paging btn-xs btn-default" type="submit"></input>';
            htmlStr += '<br /><input module="usertags" style="font-weight:bold;margin-top:5px;" value="Migrate old usertags data" id="MigrateV1Data" class="btn-whoaverse-paging btn-xs btn-default" type="submit"></input>';
            return htmlStr;
        },
        callback: function () {
            var _this = AVE.Modules['BackCompatibility'];
            $("input#MigrateV1Data").on("click", function () {
                _this.Migrate($(this).attr("module"));
            });
            $("input#ClearAllV1Data").on("click", function () {
                _this.DeleteOldData();
            });
        },
    },
};