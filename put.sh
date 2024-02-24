#!/bin/bash
site=39.106.229.26
username=sam
filename=sales

cd ./target/release

sftp $username@$site<<EOF
quote PASS $passwd
binary
put $filename
quit
EOF