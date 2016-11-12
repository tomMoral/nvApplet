// Authors:
// * Baptiste Saleil http://bsaleil.org/
// * Community: https://github.com/bsaleil/todolist-gnome-shell-extension/network
// With code from: https://github.com/vibou/vibou.gTile
//
// Licence: GPLv2+

const Gio = imports.gi.Gio;
const Clutter = imports.gi.Clutter;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

function getSettings()
{
	let dir = Extension.dir.get_child('schemas').get_path();
	let source = Gio.SettingsSchemaSource.new_from_directory(dir,
			Gio.SettingsSchemaSource.get_default(),
			false);

	if(!source)
		throw new Error('Error Initializing the thingy.');

	let schema = source.lookup('org.gnome.shell.extensions.nvapplet', false);

	if(!schema)
		throw new Error('Schema missing.');
	
	return new Gio.Settings({
		settings_schema: schema
	});
}


function debug(msg)
{
    log('[NvApplet] - DEBUG - ' + msg) 
}


function color_from_string(color){
    let clutterColor, res;
    debug("Color from string : "+color);


    if (!Clutter.Color.from_string){
        clutterColor = new Clutter.Color();
        clutterColor.from_string(color);
    } else {
        [res, clutterColor] = Clutter.Color.from_string(color);
    }
  
    return clutterColor;

}

