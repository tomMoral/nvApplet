// Authors:
// * Thomas Moreau http://tomMoral.org/
// * Community: https://github.com/tomMoral/nvapplet-gnome-shell-extension/
// With code from: https://github.com/bsaleil/todolist-gnome-shell-extension/
//
// Licence: GPLv2+
const Main = imports.ui.main;
const Gtk = imports.gi.Gtk;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const nv_applet = Extension.imports.gui_elements.nv_applet;
const debug = Extension.imports.utils.debug;

let nvApplet;	// Todolist instance
let meta;

// Init function
function init(metadata)
{
	meta = metadata;
	let iconsDir = metadata.dir.get_child('icons');
    if (iconsDir.query_exists(null)) {
        Gtk.IconTheme.get_default().append_search_path(iconsDir.get_path());
	}
}

function enable()
{
	debug("enable");
	nvApplet = new nv_applet.NvApplet(meta);
	nvApplet._enable();
	Main.panel.addToStatusArea('nvapplet', nvApplet);
}

function disable()
{
	debug("disable");
	nvApplet._disable();
	nvApplet.destroy();
	nvApplet = null;
}

//----------------------------------------------------------------------
