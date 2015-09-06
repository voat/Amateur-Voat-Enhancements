var AVE = {};
AVE.Modules = {};

AVE.Init = {
    Start: function () {
        var ModLoad, _this;

        _this = this;
        ModLoad = {
            Start: [],
            HeadReady: [],
            ContainerReady: [],
            DocReady: [],
            WinLoaded: []
        };

        AVE.Utils.EarlySet();

        if ($.inArray(AVE.Utils.currentPageType, ["none", "api"]) === -1) {

            $.each(AVE.Modules, function () {
                if (!this.RunAt || this.RunAt === "ready") {
                    ModLoad.DocReady.push(this.ID);
                } else if (this.RunAt === "start") {
                    ModLoad.Start.push(this.ID);
                } else if (this.RunAt === "head") {
                    ModLoad.HeadReady.push(this.ID);
                } else if (this.RunAt === "container") {
                    ModLoad.ContainerReady.push(this.ID);
                } else if (this.RunAt === "load") {
                    ModLoad.WinLoaded.push(this.ID);
                }
            });

            //Start as soon as possible
            $.each(ModLoad.Start, function () {
                _this.LoadModules(this);
            });

            //On head ready
            $("head").ready(function () {
                $.each(ModLoad.HeadReady, function () {
                    _this.LoadModules(this);
                });
            });

            //On container ready
            $("div#container").ready(function () {
                $.each(ModLoad.ContainerReady, function () {
                    _this.LoadModules(this);
                });
            });

            //On doc ready
            $(document).ready(function () {
                AVE.Utils.LateSet();

                print("AVE: Current page > " + AVE.Utils.currentPageType);
                //print("AVE: Current style > " + AVE.Utils.CSSstyle);

                //By /u/Jammi: voat.co/v/AVE/comments/421861
                print(document.title);
                if (document.title === 'Checking your bits' || document.title === 'Play Pen Improvements') {
                    if (~document.cookie.indexOf('theme=dark')) {
                        $.each(["body background #333", "body color #dfdfdf", "#header background #333", "#header-container background #333", "#header-container borderBottomColor #555", "#header-container borderTopColor #555", ".panel-info background #222", ".panel-heading background #222", ".panel-heading borderColor #444", ".panel-title background #222", ".panel-title color #dfdfdf", ".panel-body background #222", ".panel-body borderColor #444"],
                               function () { var _this = this.split(" "); $(_this[0]).css(_this[1], _this[2]); });
                    }
                    return;
                }//Error pages that are empty

                $.each(ModLoad.DocReady, function () {
                    _this.LoadModules(this);
                });
            });

            //On window loaded
            var loadModuleOnLoadComplete = function () {
                $.each(ModLoad.WinLoaded, function () {
                    _this.LoadModules(this);
                });
            };

            //$(window).load's callback isn't triggered if it is processed as the page's readystate already is "complete"
            if (document.readyState === "complete") { loadModuleOnLoadComplete(); }
            else { $(window).load(function () { loadModuleOnLoadComplete(); }); }
        }
    },

    LoadModules: function (ID) {
        //var module = AVE.Modules[ID];
        //print("AVE: Loading: " + module.Name + " (RunAt: " + (module.RunAt || "ready" ) + ")");

        try { AVE.Modules[ID].Load(); }
        catch (e) {print("AVE: Error loading " + ID);}
    },

    UpdateModules: function () {
        $.each(AVE.Modules, function () {
            //var ntime = 0; var time = new Date().getTime();
            
            if (typeof this.Update === "function") {
                this.Update();

                //ntime = new Date().getTime();
                //print("updated > " + this.Name + " (" + (ntime - time) + "ms)");
                //time = ntime;
            }
        });
    }
};