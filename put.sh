#!/bin/sh
site=39.106.229.26
username=sam
filename=sales

cd ./target/release

sftp $username@$site<<EOF
put $filename
quit
EOF