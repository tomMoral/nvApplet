// Authors:
// * Baptiste Saleil http://bsaleil.org/
// * Community: https://github.com/bsaleil/todolist-gnome-shell-extension/network
// With code from: https://github.com/vibou/vibou.gTile
//
// Licence: GPLv2+

const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Utils = Extension.imports.utils;
const debug = Extension.imports.utils.debug;

const Gettext = imports.gettext;
const _ = Gettext.domain('nvapplet').gettext;


const N_ = function(e) { return e; };

let name_str = "";
let value_str = "";
let opentodolist_str = "";

function append_hotkey(model, settings, name, pretty_name)
{
	let [key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0]);
	let row = model.insert(10);
	model.set(row, [0, 1, 2, 3], [name, pretty_name, mods, key ]);
}

function init()
{
}

function buildPrefsWidget() {
	let prefWindow = new PrefWindow();
	prefWindow.show_all();

	return prefWindow;
}


const PrefWindow = new GObject.Class({
	Name: 'PrefWindow',
	GTypeName: 'PrefWindow',
	Extends: Gtk.Grid,

	_init: function(params) {
		this.parent(params);
		this.margin = 12;
		this.row_spacing = this.column_spacing = 6;

		this._settings = Utils.getSettings();

		this.set_orientation(Gtk.Orientation.VERTICAL);

		// Add Widgets
		this._widgets = {};

		// Main container
		this._widgets.box = new Gtk.Box({
			orientation: Gtk.Orientation.VERTICAL,
			margin: 20,
			margin_top: 10,
			expand: true,
			spacing: 10,
		});

		// Add widgets
		this._addUpdateDelayWidget();

		this._addColorSector('gpu-load-color', _("GPU load display"));
		this._addColorSector('gpu-memory-color', _("GPU memory display"));

		// Insert main container
		this.add(this._widgets.box);
	},


	_addUpdateDelayWidget: function() {
		var label = new Gtk.Label({
			label: '<b>'+_("Update delay")+'</b>',
			use_markup: true,
			halign: Gtk.Align.START
		});

		var adjustment = new Gtk.Adjustment({
			value: this._settings.get_double('update-delay'),
			lower: .3,
			upper: 30,
			step_increment: 0.1,
			page_increment: 0.5
		});

		this._widgets.updateDelay = new Gtk.SpinButton({
			adjustment: adjustment
		});

		this._widgets.updateDelay.set_digits(2);

		let hbox = new Gtk.Box({
			orientation: Gtk.Orientation.HORIZONTAL,
		});

		hbox.pack_start(label, true, true, 0);
		hbox.add(this._widgets.updateDelay);

		this._widgets.box.add(hbox);

		this._widgets.updateDelay.connect('value-changed', Lang.bind(this, this._updateDelayChanged));
	},

    _addColorSector: function(key, name) {
		let label = new Gtk.Label({
			label: '<b>'+name+'</b>',
			use_markup: true,
			halign: Gtk.Align.START
		});
        let picker = new Gtk.ColorButton({expand:false});
        let hbox = new Gtk.HBox({spacing:5});

		hbox.pack_start(label, true, true, 0);
        hbox.pack_end(picker, false, false, 0);
        picker.set_use_alpha(true);

        let value = this._settings.get_string(key);
        let clutterColor = Utils.color_from_string(value);
        let color = new Gdk.RGBA();
        let ctemp = [clutterColor.red,clutterColor.green,clutterColor.blue,clutterColor.alpha/255];
        color.parse('rgba(' + ctemp.join(',') + ')');	
        picker.set_rgba(color);
        picker.connect('color-set', Lang.bind(this, function(color){
		    color = color.get_rgba();
		    output = N_("#%02x%02x%02x%02x").format(color.red * 255, color.green * 255,
		                                            color.blue * 255, color.alpha * 255);
            this._settings.set_string(key, output);
            debug("Set color to: "+ output);
        }));
        this._widgets.box.add(hbox);
    },

	_updateDelayChanged: function() {
		let value = this._widgets.updateDelay.get_value().toFixed(2);
		debug('New delay value: ' + value);
		this._settings.set_double('update-delay', value);
	},
});
