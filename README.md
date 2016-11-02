## nvapplet-gnome-shell-extension

This extension provides basic info about your Nvidia gpu usage:

* Display of its status: on/off (_using bbswitch_)
* Display of its memory load and usage load (_using nvidia-smi_)

## Installation

Link the git folder in your gnome sheel extension repository (mine is ~/.local/share/gnome-shell/extensions/) as nvapplet@tomMoral.org
The `install.sh` script in the repo permits to install it if :

```bash
$ ./install.sh
$ GITREPO=$(pwd)
$ cd ~/.local/share/gnome-shell/extensions/
$ ln -s $GITREPO nvapplet@tomMoral.org
```

then restart you session ```Atl-F2``` and ```r```.

## License

Licensed under the GNU General Public License. See `COPYING` for details.
