
# Update locale
echo "Build locale"
cd nvapplet@tomMoral.org/locale
./update.sh
cd ../..

# Compile schema
echo "Build schema"
glib-compile-schemas nvapplet@tomMoral.org/schemas/

echo "Install the extension for the current user"
GITREPO=$(pwd)
cd /home/$USER/.local/share/gnome-shell/extensions
rm nvapplet@tomMoral.org
ln -s $GITREPO/nvapplet@tomMoral.org .
cd $GITREPO

echo "Done. You should restart gnome shell with Alt-F2, r and enable the extension in gnome-tweak-tool"
