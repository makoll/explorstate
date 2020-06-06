# 概要
explorstateは世界中で旅行した場所を自治体単位で塗りつぶしてドヤるプロダクトです  
日本の都道府県、世界各国というものはありましたが、  
世界の自治体単位のものがなかったので作りました  
サハリンに旅行しただけなのにロシア全土行ったように見えるのは違和感がある、というのが開発動機です  

# 開発
## 環境構築
`docker-compose build`

## 起動
`docker-compose up -d`

## 用語
### area
- area: 以下のいずれかの地域をまとめる概念
- primary region: 大陸
- secondary region: 大陸の一部地域 (北ヨーロッパなど)
- country: 国
- subdivision: 地方自治体の内、各国の最上位のもの

### data
- records: 訪問エリアのデータ
