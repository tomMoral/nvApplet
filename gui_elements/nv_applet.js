const Meta = imports.gi.Meta;
const Main = imports.ui.main;
const St = imports.gi.St;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const Gettext = imports.gettext;
const Mainloop = imports.mainloop;


const Extension = imports.misc.extensionUtils.getCurrentExtension();
const ExtensionSettings = Extension.imports.utils.getSettings();
const debug = Extension.imports.utils.debug;
const PasswordDialog = Extension.imports.gui_elements.password_prompt.PasswordDialog;

const GPU_ON_ICON = Gio.icon_new_for_string(Extension.path + "/icons/gpu_on.png");
const GPU_OFF_ICON = Gio.icon_new_for_string(Extension.path + "/icons/gpu_off.png");
const GPU_ON_ICON_DARK = Gio.icon_new_for_string(Extension.path + "/icons/gpu_on_dark.png");
const GPU_OFF_ICON_DARK = Gio.icon_new_for_string(Extension.path + "/icons/gpu_off_dark.png");

const BUTTON_RELEASE = 7;
const Y_MAX = 50;
const Y_MIN = 5;
const WIDTH = 100;
const HEIGHT = 55;
const SIZE_ICON = 24;
const Y_SPAN = Y_MAX-Y_MIN;

// NvApplet object
function NvApplet(metadata)
{
    this.meta = metadata;
    this._init();
}

NvApplet.prototype = {
    state : 2,
    mainBox : null,
    timeout_loop: null,
    
    __proto__: PanelMenu.Button.prototype,

    _init : function(){        
        // Locale
        let locales = this.meta.path + "/locale";
        Gettext.bindtextdomain('nvapplet', locales);

        // Button ui
        PanelMenu.Button.prototype._init.call(this, St.Align.START);

        this._buildUI();

        // Key binding
        let mode = Shell.ActionMode ? Shell.ActionMode.ALL : Shell.KeyBindingMode.ALL;
        Main.wm.addKeybinding('open-nvapplet',
                              ExtensionSettings,
                              Meta.KeyBindingFlags.NONE,
                              mode,
                              Lang.bind(this, this.signalKeyOpen));
    },
    _buildUI: function(){
        // Destroy previous box         
        if (this.mainBox != null)
            this.mainBox.destroy();

        //Set size actor
        this.actor.set_size(WIDTH, HEIGHT);
        this.box = new St.BoxLayout();
        this.actor.add_actor(this.box);

        // Add main icon
        this.gpu_icon = new St.Icon({icon_size: SIZE_ICON, gicon: GPU_ON_ICON,
                                     style_class: 'gpu_icon', x_expand: true});

        this.back_load_indic = new St.Widget({
            style_class: 'indic_back',
            width : 15,
            height: Y_SPAN
        });
        this.front_load_indic = new St.Widget({
            style_class: 'indic_load',
        });
        this.back_mem_indic = new St.Widget({
            style_class: 'indic_back',
            width : 15,
            height: Y_SPAN
        });
        this.front_mem_indic = new St.Widget({
            style_class: 'indic_mem',
        });
        this.box.add_child(this.back_mem_indic);
        this.box.add_actor(this.gpu_icon);
        this.box.add_child(this.back_load_indic);
        
        this.box.add_child(this.front_load_indic);
        this.box.add_child(this.front_mem_indic);
        this._check_state();


        // Create main box
        this.mainBox = new St.BoxLayout();
        this.mainBox.set_vertical(true);

        // Create todos box
        let nvBox = new PopupMenu.PopupMenuSection('nvBox');
        nvBox.one = false;
        // Call back to ensure only one section is open
        nvBox._setOpenedSubMenu = function(subMenu){
            if(nvBox.one)
                return;
            nvBox.one = true;

            for each (var item in nvBox._getMenuItems()){
                item.menu.close();
            }
            if(subMenu != null)
                subMenu.open();
            nvBox.one = false;
        }
        let item_shutdown = new PopupMenu.PopupMenuItem("Shutdown Nvidia card")
        item_shutdown.actor.connect('event', 
                                    Lang.bind(this, function(actor, ev){

            if(ev.type() != BUTTON_RELEASE)
                return;
            let mod = new PasswordDialog("");
            mod.set_callback(Lang.bind(this, this._shutdown_nvidia));
            mod.open();
        }));
        nvBox.addMenuItem(item_shutdown);
        this.nvBox = nvBox;

        // Create todos scrollview
        var scrollView = new St.ScrollView({style_class: 'vfade',
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            vscrollbar_policy: Gtk.PolicyType.AUTOMATIC});
        scrollView.add_actor(this.nvBox.actor);
        this.mainBox.add_actor(scrollView);

        // Separator
        var separator = new PopupMenu.PopupSeparatorMenuItem();
        this.mainBox.add_actor(separator.actor);
        this.menu.box.add(this.mainBox);
    },
    _enable : function() {
        // Conect file 'changed' signal to _refresh
        let fileM = Gio.file_new_for_path('/proc/acpi/bbswitch');
        this.monitor = fileM.monitor(Gio.FileMonitorFlags.NONE, null);
        this.monitor.connect('changed', Lang.bind(this, this._file_changed));


        // Add loop to change state
        this.timeout_loop = Mainloop.timeout_add_seconds(3, Lang.bind(this, this._check_state));
    },
    _disable : function() {
        // Stop monitoring file
        this.monitor.cancel();
        if (this.timeout_loop != null){
            let state_exit = Mainloop.source_remove(this.timeout_loop);
            debug("source remove exit code: " + state_exit);
        }
        debug('Safe stop for Mainloop');
        Main.wm.removeKeybinding('open-nvapplet')
        this.gpu_icon.destroy();
        this.back_load_indic.destroy();
        this.front_load_indic.destroy();
    },
    // Called when 'open-nvapplet' is emitted (binded with Lang.bind)
    signalKeyOpen: function(){
        if (this.menu.isOpen)
            this.menu.close();
        else{
            this.menu.open();
        }
    },
    _file_changed: function(){
        debug("State changed");
        this._check_state()
    },
    _check_state: function(){
        let bb_state = GLib.spawn_command_line_sync("cat /proc/acpi/bbswitch")[1].toString();
        if (bb_state.length == 16 && this.state != 1){
            this.gpu_icon.set_gicon(GPU_ON_ICON);
            this.back_load_indic.show();
            this.back_mem_indic.show();
            this.state = 1;
        }
        if (bb_state.length == 17 && this.state != 0){
            this.gpu_icon.set_gicon(GPU_OFF_ICON);
            this.state = 0;
            this.back_load_indic.hide();
            this.back_mem_indic.hide();
        }
        if (this.state == 1)
            this._update_load();
        return true;
    },
    _update_load: function(){
        let Popen = GLib.spawn_command_line_sync(
            "nvidia-smi --query-gpu=utilization.gpu,memory.total,memory.used --format=csv,nounits,noheader"
        );
        let values = Popen[1].toString().split(',');

        // If values.length != 3, it means we failed to probe the utilization of the GPU
        if(values.length == 1)
            return

        let load = parseInt(values[0]);
        let g = this.back_load_indic.get_allocation_box();
        let y = g.y2-2 - (g.y2-g.y1-4) * load/100;

        this.front_load_indic.allocate(
            new Clutter.ActorBox({
                x1:g.x1+2, x2:g.x2-2,
                y1:y, y2:g.y2-2
            }), 0);

        let mem_total = parseInt(values[1]);
        let mem_used = parseInt(values[2]);
        g = this.back_mem_indic.get_allocation_box();
        y = g.y2 - (g.y2-g.y1-4) * mem_used/mem_total;

        this.front_mem_indic.allocate(
            new Clutter.ActorBox({
                x1:g.x1+2, x2:g.x2-2,
                y1:y, y2:g.y2-2
            }), 0);
        
    },
    _run_cmd: function(pass, cmd){
        debug(cmd);
        let [res, pid, in_fd, out_fd, err_fd]  = GLib.spawn_async_with_pipes(null,
            cmd, null, 0, null)
        let out_reader = new Gio.DataInputStream({
            base_stream: new Gio.UnixInputStream({fd: out_fd})
        });
        let err_reader = new Gio.DataInputStream({
            base_stream: new Gio.UnixInputStream({fd: err_fd})
        });
        let in_writer = new Gio.DataOutputStream({
            base_stream: new Gio.UnixOutputStream({fd: in_fd})
        });
        in_writer.put_string(pass, null);
        let [out, size] = out_reader.read_line(null);
        let [err, size] = err_reader.read_line(null);
    },
    _shutdown_nvidia: function(sudo_pass){
        let cmd = ['/bin/sudo', '-S', '-k', 'rmmod', 'nvidia'];
        this._run_cmd(sudo_pass, cmd);

        cmd = ['/bin/sudo', '-S', '-k', 'tee', '/proc/acpi/bbswitch', ' <<< OFF'];
        this._run_cmd(sudo_pass, cmd);
    },
}
