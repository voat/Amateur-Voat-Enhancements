AVE.Modules['CommentFilter'] = {
    ID: 'CommentFilter',
    Name: 'Comment Filter',
    Desc: 'Choose keywords to filter comments by hiding or removing them.',
    Category: 'Thread',

    Index: 100,
    Enabled: false,

    Store: {},

    Options: {
        Enabled: {
            Type: 'boolean',
            Value: true
        },
        Filters: {
            Type: 'array',
            Desc: "Example of filter",
            Value: []
        },
        RemoveFiltered: {
            Type: 'boolean',
            Desc: "Remove the comment and its child comments altogether.",
            Value: false
        }
    },

    Filter: function (id, keyword, sub) {
        this.Id = id || 0;
        this.Keywords = keyword || []; //List of keywords
        this.ApplyToSub = sub || []; //List of subs
    },

    Processed: [], //Ids of comments that have already been processed

    OriginalOptions: "",

    SavePref: function (POST) {
        var _this = this;
        POST = POST[this.ID];

        var id, kw, sub, tV;

        this.Options.Filters.Value = [];

        $.each(POST, function (k, v) {
            tV = k.split("-");
            if (tV.length === 2) {
                id = parseInt(tV[0], 10);
            } else { return true; } //if this isn't a filter value: continue

            if (tV[1] === "kw") {
                if (v.length === 0) { return true; } //If no kw were specified: continue
                //else
                _this.Options.Filters.Value.push(new _this.Filter(id, v.toLowerCase().split(","), []));
            } else if (tV[1] === "sub") {
                var inArr = $.grep(_this.Options.Filters.Value, function (e) { return e.Id === id; });
                if (inArr.length === 0) {
                    //if there is no filter with this ID: continue
                    return true;
                } else if (v.length !== 0) {
                    var idx = $.inArray(inArr[0], _this.Options.Filters.Value);
                    _this.Options.Filters.Value[idx].ApplyToSub = v.toLowerCase().split(",");
                }
            }
        });

        this.Store.SetValue(this.Store.Prefix + this.ID,
            JSON.stringify(
                {
                    Enabled: POST.Enabled,
                    RemoveFiltered: POST.RemoveFiltered,
                    Filters: this.Options.Filters.Value
                }
            )
        );
    },

    ResetPref: function () {
        this.Options = JSON.parse(this.OriginalOptions);
    },

    SetOptionsFromPref: function () {
        var _this = this;
        var Opt = _this.Store.GetValue(_this.Store.Prefix + _this.ID, "{}");

        $.each(JSON.parse(Opt), function (key, value) {
            if (!_this.Options.hasOwnProperty(key)) {print("AVE: loading "+_this.ID+" > option key " +key+" doesn't exist", true);return true;}
            _this.Options[key].Value = value;
        });

        _this.Enabled = _this.Options.Enabled.Value;
    },

    Load: function () {
        this.Store = AVE.Storage;
        this.OriginalOptions = JSON.stringify(this.Options);
        this.SetOptionsFromPref();

        if ($.inArray(AVE.Utils.currentPageType, ["thread"]) === -1) {
            this.Enabled = false;
        }

        if (this.Enabled) {
            this.Start();
        }
    },

    Start: function () {
        var _this = this;
        //When a Comment is filtered it is removed, so no need to check anyting special when the update method is triggered.

        var re, found;
        $("div.comment").each(function () {
            var authorStr = $(this).find("a.author.userinfo").attr("data-username");
            var commentRef = $(this);
            var commentStr = commentRef.find("div.md:first").text().toLowerCase();

            if ($.inArray($(this).find("input#CommentId").val(), _this.Processed) !== -1)
            { return true; }
            //else
            _this.Processed.push($(this).find("input#CommentId").val());

            $.each(_this.Options.Filters.Value, function () {
                found = false;
                if (this.ApplyToSub.length === 0 || $.inArray(AVE.Utils.subverseName, this.ApplyToSub) !== -1) {
                    $.each(this.Keywords, function () {
                        if (this.length === 0) { return true; }//Just in case
                        re = new RegExp(this);
                        if (re.test(commentStr)) {
                            if (_this.Options.RemoveFiltered.Value) {
                                print("AVE: removed Comment by \"" + authorStr + "\" (kw: \"" + this + "\")");
                                commentRef.remove();
                            } else {
                                print("AVE: hid Comment by \"" + authorStr + "\" (kw: \"" + this + "\")");
                                commentRef.find("div.md:first").hide();

                                var commentContainer = commentRef.find("div.md:first").parent();//div.usertext-body#commentContent-id
                                commentContainer.append('<a href="javascript:void(0)" title="Show comment" AVE="HiddenComment">Comment filtered (kw: "' + this + '"). Click to display.</a>');
                                commentContainer.find("a[AVE='HiddenComment']")
                                        .css("font-size", "10px")
                                        .css("margin-left", "20px")
                                        .css("font-weight", "bold");
                            }
                            found = true; //no point in continuing since the Comment has already been removed/hidden
                            return false; //break
                        }
                    });
                }
                if (found) { return false; } //break (out of kw loop)
            });
            if (found) { return true; } //continue (to next submission)
        });

        this.Listeners();
    },

    Listeners: function () {
        if ($("a[AVE='HiddenComment']").length > 0) {
            $("a[AVE='HiddenComment']").off("click").on("click", function () {
                $(this).parent().find("div.md").show();
                $(this).remove();
            });
        }
    },

    Update: function () {
        if (this.Enabled) {
            this.Start();
        }
    },

    AppendToPreferenceManager: {
        htmlNewFilter: '',

        html: function () {
            var _this = AVE.Modules['CommentFilter'];
            var Pref_this = this;
            var htmlStr = "";

            this.htmlNewFilter = '<span class="AVE_Comment_Filter" id="{@id}">\
                                Keyword(s) \
                                    <input id="{@id}-kw" style="width:40%;background-color: #' + (AVE.Utils.CSSstyle === "dark" ? "2C2C2C" : "DADADA") + ';" type="text" Module="CommentFilter" value="{@keywords}">\
                                Subverse(s) \
                                    <input id="{@id}-sub" style="width:29%;background-color: #' + (AVE.Utils.CSSstyle === "dark" ? "2C2C2C" : "DADADA") + ';" type="text" Module="CommentFilter" value="{@subverses}">\
                                </span>\
                                <a href="javascript:void(0)" title="Remove filter" style="font-size: 16px;font-weight: bold;" class="RemoveFilter" id="{@id}">-</a>';

            htmlStr += '<input ' + (_this.Options.RemoveFiltered.Value ? 'checked="true"' : "") + ' id="RemoveFiltered" type="checkbox"/><label for="RemoveFiltered"> Remove filtered comment instead of replacing the text.</label><br />';

            htmlStr += '<span style="font-weight:bold;"> Example: "ex" matches "rex", "example" and "bexter".<br />Separate keywords and subverse names by a comma.</span><br />';

            var count = 0;
            $.each(_this.Options.Filters.Value, function () {
                var filter = Pref_this.htmlNewFilter + "<br />";
                filter = filter.replace(/\{@id}/ig, count);
                filter = filter.replace("{@keywords}", this.Keywords.join(","));
                filter = filter.replace("{@subverses}", this.ApplyToSub.join(","));
                count++;
                htmlStr += filter;
            });

            htmlStr += '<a style="margin-top: 10px;" href="javascript:void(0)" class="btn-whoaverse-paging btn-xs btn-default btn-sub" id="AddNewFilter">Add new filter</a>';

            return htmlStr;
        },

        callback: function () {
            var Pref_this = this;
            $("div#CommentFilter > div.AVE_ModuleCustomInput > a#AddNewFilter").on("click", function () {
                var html = Pref_this.htmlNewFilter + "<br />";
                html = html.replace(/\{@id\}/ig, parseInt($("div#CommentFilter > div.AVE_ModuleCustomInput > span.AVE_Comment_Filter:last").attr("id"), 10) + 1);
                html = html.replace("{@keywords}", "");
                html = html.replace("{@subverses}", "");

                $(html).insertBefore("div#CommentFilter > div.AVE_ModuleCustomInput > a#AddNewFilter");

                $("div#CommentFilter > div.AVE_ModuleCustomInput > a.RemoveFilter").off("click")
                    .on("click", function () {
                    $(this).next("br").remove();
                    $(this).prev("span.AVE_Comment_Filter").remove();
                    $(this).remove();
                });
                AVE.Modules.PreferenceManager.ChangeListeners();
            });

            $("div#CommentFilter > div.AVE_ModuleCustomInput > a.RemoveFilter").off("click")
                .on("click", function () {
                $(this).next("br").remove();
                $(this).prev("span.AVE_Comment_Filter").remove();
                $(this).remove();

                AVE.Modules.PreferenceManager.AddToModifiedModulesList("CommentFilter");
            });
        },
    },
};