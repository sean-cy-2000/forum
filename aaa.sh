#!/bin/bash

echo "/home/sean2000/express.js/forum:"
ls -a

echo "tree -I node_modules"
tree -I node_modules

echo "執行 npm list..."
npm list

# 等待 npm list 完成後執行 cat package.json
echo -e "\n輸出 package.json..."
cat package.json

# 使用 find 列出 src 目錄下的所有檔案，並依次 cat 每一個檔案
echo -e "\n正在輸出 src 目錄下的所有檔案..."
find src -type f | while read file; do
    echo -e "\n正在輸出 $file..."
    cat "$file"
done