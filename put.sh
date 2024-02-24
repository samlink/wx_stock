#!/bin/bash

ftp_site=39.106.229.26
username=sam
passwd=7298
filename=sales
PS3='Select a destination directory: '

cd ./target/release

do
ftp -n $ftp_site<<EOF
quote USER $username
quote PASS $passwd
binary
cd $path
put $filename
quit
EOF
break
done