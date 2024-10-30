#!/bin/bash

# 函數：輸出檔案內容
output_file() {
    local file="$1"
    echo "正在輸出 $file ..."
    echo "----------------------------------------"
    cat "$file"
    echo "----------------------------------------"
    echo ""
}

# 遍歷當前目錄及子目錄中的所有檔案
find . -type f | while read -r file
do
    # 檢查檔案是否可讀
    if [ -r "$file" ]; then
        output_file "$file"
    else
        echo "無法讀取 $file，跳過"
    fi
done