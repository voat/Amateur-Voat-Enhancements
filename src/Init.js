var AVE = {};
AVE.Modules = {};

AVE.Init = {
    stopLoading: false,
    Start: function () {

        var _this = this,
            ModLoad = {
                Start: [],
                HeadReady: [],
                BannerReady: [],
                ContainerReady: [],
                DocReady: [],
                WinLoaded: []
            };

        AVE.Utils.EarlySet();

        print("AVE: Devmode > " + AVE.Utils.DevMode, true);
        print("AVE: POST > "+JSON.stringify(AVE.Utils.POSTinfo), true);

        print("AVE: Current page > " + AVE.Utils.currentPageType);

        if ($.inArray(AVE.Utils.currentPageType, ["none", "api"]) === -1) {

            $.each(AVE.Modules, function () {
                if (!this.RunAt || this.RunAt === "ready") {
                    ModLoad.DocReady.push(this.ID);
                } else if (this.RunAt === "start") {
                    ModLoad.Start.push(this.ID);
                } else if (this.RunAt === "head") {
                    ModLoad.HeadReady.push(this.ID);
                } else if (this.RunAt === "banner") {
                    ModLoad.BannerReady.push(this.ID);
                } else if (this.RunAt === "container") {
                    ModLoad.ContainerReady.push(this.ID);
                } else { //(this.RunAt === "load") {
                    ModLoad.WinLoaded.push(this.ID);
                }
                //   "start"     => as soon as possible
                //   "head"      => On head ready
                //   "banner"    => On header/banner ready
                //   "container" => On container ready
                //   "ready"     => On DOMready
                //   "load"      => On DOMload
                // "ready" by default if RunAt is undefined
                // "load" by default if RunAt is not one of the values above
            });

            //Start as soon as possible
            print("Init: Starting as soon as possible", true);
            $.each(ModLoad.Start, function () {
                _this.LoadModules(this);
            });

            //On head ready
            $("head").ready(function () {
                //By /u/Jammi: voat.co/v/AVE/comments/421861
                if (document.title === 'Checking your bits' || document.title === 'Play Pen Improvements') { // Add CDN error page
                    print("AVE: this is an error page, no more modules will be started");
                    if (~document.cookie.indexOf('theme=dark')) {
                        $.each(["body background #333", "body color #dfdfdf", "#header background #333", "#header-container background #333", "#header-container borderBottomColor #555", "#header-container borderTopColor #555", ".panel-info background #222", ".panel-heading background #222", ".panel-heading borderColor #444", ".panel-title background #222", ".panel-title color #dfdfdf", ".panel-body background #222", ".panel-body borderColor #444"],
                            function () { var _this = this.split(" "); $(_this[0]).css(_this[1], _this[2]); });
                    }
                    this.stopLoading = true;
                    return;
                }//Error pages that are empty

                AVE.Utils.LateSet();
                print("WARNING!! Change metafile, l25, l63");
                
                print("Init: Starting on Head ready", true);
                $.each(ModLoad.HeadReady, function () {
                    _this.LoadModules(this);
                });
            });

            //On Banner ready
            $("div#header").ready(function () {
                print("Init: Starting on Banner ready", true);
                $.each(ModLoad.BannerReady, function () {
                    _this.LoadModules(this);
                });
            });

            //On container ready
            $("div#container").ready(function () {
                print("Init: Starting on Container ready", true);
                $.each(ModLoad.ContainerReady, function () {
                    _this.LoadModules(this);
                });
            });

            //On doc ready
            $(document).ready(function () {
                print("Init: Starting on Doc ready", true);
                print("AVE: Current style > " + AVE.Utils.CSSstyle, true);
                
                $.each(ModLoad.DocReady, function () {
                    _this.LoadModules(this);
                });
            });
            //On window loaded
            var loadModuleOnLoadComplete = function () {
                print("Init: Starting on Window loaded (last)", true);
                if (this.stopLoading){return;}
                $.each(ModLoad.WinLoaded, function () {
                    _this.LoadModules(this);
                });
            };

            //$(window).load's callback isn't triggered if it is processed as the page's readystate already is "complete"
            if (document.readyState === "complete") { loadModuleOnLoadComplete(); }
            else { $(window).load(function () { loadModuleOnLoadComplete(); }); }
        } else {
            print("AVE: Current page > no idea, sorry. Maybe tell /u/HorzaDeservedBetter about it?");
        }
    },

    LoadModules: function (ID) {
        if (this.stopLoading){return;}
        var module = AVE.Modules[ID];
        print("  AVE: Loading: " + module.Name + " (RunAt: " + (module.RunAt || "ready" ) + ")", true);

        if (AVE.Utils.DevMode){
            var time = Date.now();
            AVE.Modules[ID].Load();
            print("    Loaded > " + ID + " (" + (Date.now() - time) + "ms)");
        } else {
            try { AVE.Modules[ID].Load(); }
            catch (e) {
                print("AVE: Error loading " + ID);
                //if (true) { console.error(e); }
                var Opt = JSON.parse(AVE.Storage.GetValue(AVE.Storage.Prefix + ID, "{}"));
                Opt.Enabled = false;
                AVE.Storage.SetValue(AVE.Storage.Prefix + ID, JSON.stringify(Opt));
                alert("AVE: Error loading module \"" + ID +"\"\nIt has been disabled, reload for the change to be effective");
            }
        }
    },

    UpdateModules: function () {
        $.each(AVE.Modules, function () {
            var time = Date.now();
            
            if (typeof this.Update === "function") {
                this.Update();

                print("updated > " + this.Name + " (" + (Date.now() - time) + "ms)", true);
            }
        });
    }
};