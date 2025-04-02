# JavBus API 使用手册

## 简介

JavBus API 是一个自托管服务，提供对 JavBus 网站数据的结构化访问。本 API 允许开发者以 JSON 格式获取影片信息、演员信息和磁力链接等数据。此 API 适用于开发自己的视频信息网站、移动应用，或创建各种自动化工具。

## 认证方式

API 支持两种认证方式：

### 1. 用户名密码认证

适用于浏览器访问，设置以下环境变量开启：

```
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
JAVBUS_SESSION_SECRET=your_session_secret (可选)
```

### 2. Token 认证

适用于 API 程序调用，设置以下环境变量开启：

```
JAVBUS_AUTH_TOKEN=your_token
```

使用 Token 时，需要在请求头中添加：

```
j-auth-token: your_token
```

## API 端点

### 1. 影片列表 - GET /api/movies

获取影片列表，支持分页和多种筛选条件。

#### 参数

| 参数名      | 类型   | 必须 | 默认值   | 说明                                                                                           |
| ----------- | ------ | ---- | -------- | ---------------------------------------------------------------------------------------------- |
| page        | string | 否   | "1"      | 页码                                                                                           |
| magnet      | string | 否   | "exist"  | 过滤条件："exist"(只返回有磁链的影片) 或 "all"(全部影片)                                       |
| type        | string | 否   | "normal" | 影片类型："normal"(有码) 或 "uncensored"(无码)                                                 |
| filterType  | string | 否   | -        | 筛选类型：star(演员), genre(类别), director(导演), studio(制作商), label(发行商), series(系列) |
| filterValue | string | 否   | -        | 筛选值，与 filterType 一起使用                                                                 |

#### 示例请求

```
GET /api/movies
GET /api/movies?page=2&magnet=all
GET /api/movies?filterType=star&filterValue=rsv
GET /api/movies?type=uncensored
```

#### 示例响应

```json
{
  "movies": [
    {
      "date": "2023-04-28",
      "id": "YUJ-003",
      "img": "https://www.javbus.com/pics/thumb/9n0d.jpg",
      "title": "夫には言えない三日間。 セックスレスで欲求不満な私は甥っ子に中出しさせています。 岬ななみ",
      "tags": ["高清", "字幕", "3天前新種"]
    }
    // 更多影片...
  ],
  "pagination": {
    "currentPage": 1,
    "hasNextPage": true,
    "nextPage": 2,
    "pages": [1, 2, 3]
  },
  "filter": {
    "name": "岬ななみ",
    "type": "star",
    "value": "rsv"
  }
}
```

### 2. 搜索影片 - GET /api/movies/search

通过关键词搜索影片。

#### 参数

| 参数名  | 类型   | 必须 | 默认值   | 说明                                             |
| ------- | ------ | ---- | -------- | ------------------------------------------------ |
| keyword | string | 是   | -        | 搜索关键词                                       |
| page    | string | 否   | "1"      | 页码                                             |
| magnet  | string | 否   | "exist"  | 过滤条件："exist"(只返回有磁链的) 或 "all"(全部) |
| type    | string | 否   | "normal" | 影片类型："normal"(有码) 或 "uncensored"(无码)   |

#### 示例请求

```
GET /api/movies/search?keyword=三上
GET /api/movies/search?keyword=三上&page=2&magnet=all
```

#### 示例响应

```json
{
  "movies": [
    {
      "date": "2020-08-15",
      "id": "SSNI-845",
      "img": "https://www.javbus.com/pics/thumb/7t44.jpg",
      "title": "彼女の姉は美人で巨乳しかもドS！大胆M性感プレイでなす術もなくヌキまくられるドMな僕。 三上悠亜",
      "tags": ["高清", "字幕"]
    }
    // 更多影片...
  ],
  "pagination": {
    "currentPage": 1,
    "hasNextPage": true,
    "nextPage": 2,
    "pages": [1, 2, 3, 4, 5]
  },
  "keyword": "三上"
}
```

### 3. 影片详情 - GET /api/movies/{movieId}

获取单部影片的详细信息。

#### 参数

| 参数名  | 类型   | 必须 | 默认值 | 说明                |
| ------- | ------ | ---- | ------ | ------------------- |
| movieId | string | 是   | -      | 影片ID，如 SSIS-406 |

#### 示例请求

```
GET /api/movies/SSIS-406
```

#### 示例响应

```json
{
  "id": "SSIS-406",
  "title": "SSIS-406 才色兼備な女上司が思う存分に羽目を外し僕を連れ回す【週末限定】裏顔デート 葵つかさ",
  "img": "https://www.javbus.com/pics/cover/8xnc_b.jpg",
  "imageSize": {
    "width": 800,
    "height": 538
  },
  "date": "2022-05-20",
  "videoLength": 120,
  "director": {
    "id": "hh",
    "name": "五右衛門"
  },
  "producer": {
    "id": "7q",
    "name": "エスワン ナンバーワンスタイル"
  },
  "publisher": {
    "id": "9x",
    "name": "S1 NO.1 STYLE"
  },
  "series": {
    "id": "xx",
    "name": "xx"
  },
  "genres": [
    {
      "id": "e",
      "name": "巨乳"
    }
    // 更多类别...
  ],
  "stars": [
    {
      "id": "2xi",
      "name": "葵つかさ"
    }
  ],
  "samples": [
    {
      "alt": "SSIS-406 才色兼備な女上司が思う存分に羽目を外し僕を連れ回す【週末限定】裏顔デート 葵つかさ - 樣品圖像 - 1",
      "id": "8xnc_1",
      "src": "https://pics.dmm.co.jp/digital/video/ssis00406/ssis00406jp-1.jpg",
      "thumbnail": "https://www.javbus.com/pics/sample/8xnc_1.jpg"
    }
    // 更多预览图...
  ],
  "similarMovies": [
    {
      "id": "SNIS-477",
      "title": "クレーム処理会社の女社長 土下座とカラダで解決します 夢乃あいか",
      "img": "https://www.javbus.com/pics/thumb/4wml.jpg"
    }
    // 更多相似影片...
  ],
  "gid": "50217160940",
  "uc": "0"
}
```

### 4. 影片简介 - GET /api/movies/{movieId}/summary

获取影片的简介信息（从 FANZA 网站获取）。

#### 参数

| 参数名  | 类型   | 必须 | 默认值 | 说明   |
| ------- | ------ | ---- | ------ | ------ |
| movieId | string | 是   | -      | 影片ID |

#### 示例请求

```
GET /api/movies/SSIS-406/summary
```

#### 示例响应

```json
{
  "movieId": "SSIS-406",
  "summary": "和这位才华与美貌兼备的女上司一起度过了难忘的周末约会...",
  "url": "https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=ssis00406/"
}
```

### 5. 批量获取影片详情 - POST /api/movies/bulk-details

批量获取多部影片的详细信息。

#### 请求体

```json
{
  "ids": ["SSIS-406", "SSNI-845"]
}
```

#### 参数

| 参数名 | 类型     | 必须 | 默认值 | 说明       |
| ------ | -------- | ---- | ------ | ---------- |
| ids    | string[] | 是   | -      | 影片ID数组 |

#### 示例响应

```json
[
  {
    "id": "SSIS-406",
    "title": "SSIS-406 才色兼備な女上司が思う存分に羽目を外し僕を連れ回す【週末限定】裏顔デート 葵つかさ"
    // 完整影片详情...
  },
  {
    "id": "SSNI-845",
    "title": "彼女の姉は美人で巨乳しかもドS！大胆M性感プレイでなす術もなくヌキまくられるドMな僕。 三上悠亜"
    // 完整影片详情...
  }
]
```

### 6. 获取磁力链接 - GET /api/magnets/{movieId}

获取影片的磁力链接列表。

#### 参数

| 参数名    | 类型   | 必须 | 默认值 | 说明                                   |
| --------- | ------ | ---- | ------ | -------------------------------------- |
| movieId   | string | 是   | -      | 影片ID                                 |
| gid       | string | 是   | -      | 从影片详情获取的 gid                   |
| uc        | string | 是   | -      | 从影片详情获取的 uc                    |
| sortBy    | string | 否   | "size" | 排序字段："date"(日期) 或 "size"(大小) |
| sortOrder | string | 否   | "desc" | 排序方式："desc"(降序) 或 "asc"(升序)  |

#### 示例请求

```
GET /api/magnets/SSNI-730?gid=42785257471&uc=0
GET /api/magnets/SSNI-730?gid=42785257471&uc=0&sortBy=date&sortOrder=desc
```

#### 示例响应

```json
[
  {
    "id": "17508BF5C17CBDF7C77E12DAAD1BDAB325116585",
    "link": "magnet:?xt=urn:btih:17508BF5C17CBDF7C77E12DAAD1BDAB325116585&dn=SSNI-730-C",
    "isHD": true,
    "title": "SSNI-730-C",
    "size": "6.57GB",
    "numberSize": 7054483783,
    "shareDate": "2021-03-14",
    "hasSubtitle": true
  }
  // 更多磁力链接...
]
```

### 7. 获取演员信息 - GET /api/stars/{starId}

获取演员的详细信息。

#### 参数

| 参数名 | 类型   | 必须 | 默认值   | 说明                                           |
| ------ | ------ | ---- | -------- | ---------------------------------------------- |
| starId | string | 是   | -        | 演员ID                                         |
| type   | string | 否   | "normal" | 演员类型："normal"(有码) 或 "uncensored"(无码) |

#### 示例请求

```
GET /api/stars/2xi
GET /api/stars/2jd?type=uncensored
```

#### 示例响应

```json
{
  "avatar": "https://www.javbus.com/pics/actress/2xi_a.jpg",
  "id": "2xi",
  "name": "葵つかさ",
  "birthday": "1990-08-14",
  "age": "32",
  "height": "163cm",
  "bust": "88cm",
  "waistline": "58cm",
  "hipline": "86cm",
  "birthplace": "大阪府",
  "hobby": "ジョギング、ジャズ鑑賞、アルトサックス、ピアノ、一輪車"
}
```

### 8. 用户相关接口

#### 8.1 获取用户信息 - GET /api/user

获取当前用户信息。

#### 示例响应

```json
{
  "username": "admin",
  "useCredentials": true
}
```

#### 8.2 用户登录 - POST /api/login

提交用户名和密码进行登录。

#### 请求体

```json
{
  "username": "admin",
  "password": "password"
}
```

#### 示例响应

```json
{
  "success": true,
  "message": "Login success"
}
```

#### 8.3 用户登出 - POST /api/logout

登出当前用户。

#### 示例响应

```json
{
  "success": true,
  "message": "Logout success"
}
```

## 数据结构

### Movie (影片)

```typescript
interface Movie {
  date: string | null; // 发行日期
  title: string; // 影片标题
  id: string; // 影片ID
  img: string | null; // 封面图片URL
  tags: string[]; // 标签（如高清、字幕等）
}
```

### MovieDetail (影片详情)

```typescript
interface MovieDetail {
  id: string; // 影片ID
  title: string; // 完整标题
  img: string | null; // 封面大图URL
  date: string | null; // 发行日期
  videoLength: number | null; // 片长（分钟）
  director: Property | null; // 导演
  producer: Property | null; // 制作商
  publisher: Property | null; // 发行商
  series: Property | null; // 系列
  genres: Property[]; // 类别列表
  stars: Property[]; // 演员列表
  imageSize: ImageSize | null; // 封面图片尺寸
  samples: Sample[]; // 预览图列表
  similarMovies: SimilarMovie[]; // 相似影片
  gid: string | null; // 磁力链接参数
  uc: string | null; // 磁力链接参数
}
```

### MovieSummary (影片简介)

```typescript
interface MovieSummary {
  movieId: string; // 影片ID
  summary: string | null; // 影片简介
  url: string | null; // 简介来源URL
}
```

### Magnet (磁力链接)

```typescript
interface Magnet {
  id: string; // 磁力链接ID
  link: string; // 完整磁力链接
  isHD: boolean; // 是否高清
  title: string; // 标题
  size: string | null; // 文件大小（格式化后的字符串）
  numberSize: number | null; // 文件大小（字节数）
  shareDate: string | null; // 分享日期
  hasSubtitle: boolean; // 是否包含字幕
}
```

### StarInfo (演员信息)

```typescript
interface StarInfo {
  avatar: string | null; // 头像URL
  id: string; // 演员ID
  name: string; // 演员名称
  birthday: string | null; // 生日
  age: number | null; // 年龄
  height: number | null; // 身高（cm）
  bust: string | null; // 胸围
  waistline: string | null; // 腰围
  hipline: string | null; // 臀围
  birthplace: string | null; // 出生地
  hobby: string | null; // 爱好
}
```

## 使用示例

### JavaScript/Node.js

```javascript
// 获取影片列表
async function getMovies() {
  const response = await fetch('http://localhost:8922/api/movies?page=1&magnet=exist');
  const data = await response.json();
  console.log(data);
}

// 搜索影片
async function searchMovies(keyword) {
  const response = await fetch(
    `http://localhost:8922/api/movies/search?keyword=${encodeURIComponent(keyword)}`
  );
  const data = await response.json();
  console.log(data);
}

// 获取影片详情
async function getMovieDetail(movieId) {
  const response = await fetch(`http://localhost:8922/api/movies/${movieId}`);
  const data = await response.json();
  console.log(data);
}

// 获取影片简介
async function getMovieSummary(movieId) {
  const response = await fetch(`http://localhost:8922/api/movies/${movieId}/summary`);
  const data = await response.json();
  console.log(data);
}

// 使用Token认证
async function getMovieDetailWithToken(movieId, token) {
  const response = await fetch(`http://localhost:8922/api/movies/${movieId}`, {
    headers: {
      'j-auth-token': token
    }
  });
  const data = await response.json();
  console.log(data);
}
```

### Python

```python
import requests

# 基本URL
base_url = "http://localhost:8922/api"

# 获取影片列表
def get_movies(page=1, magnet="exist"):
    response = requests.get(f"{base_url}/movies", params={
        "page": page,
        "magnet": magnet
    })
    return response.json()

# 搜索影片
def search_movies(keyword, page=1):
    response = requests.get(f"{base_url}/movies/search", params={
        "keyword": keyword,
        "page": page
    })
    return response.json()

# 获取影片详情
def get_movie_detail(movie_id):
    response = requests.get(f"{base_url}/movies/{movie_id}")
    return response.json()

# 获取影片简介
def get_movie_summary(movie_id):
    response = requests.get(f"{base_url}/movies/{movie_id}/summary")
    return response.json()

# 获取磁力链接
def get_magnets(movie_id, gid, uc):
    response = requests.get(f"{base_url}/magnets/{movie_id}", params={
        "gid": gid,
        "uc": uc
    })
    return response.json()

# 使用Token认证
def get_movie_with_token(movie_id, token):
    headers = {"j-auth-token": token}
    response = requests.get(f"{base_url}/movies/{movie_id}", headers=headers)
    return response.json()
```

## 注意事项

1. 本API是对JavBus网站的实时数据转换，不依赖数据库。每个请求会实时从JavBus获取数据，因此API的可用性依赖于JavBus网站。

2. 目前使用美国IP代理或部署在美国地区的VPS上可能会导致JavBus跳转到登录页面，从而使API无法获取数据。建议使用其他地区的IP代理或VPS。

3. 当使用Vercel部署时，建议选择除美国以外的地区，如日本、香港等，以确保API能够正常工作。

4. 为了保护API不被恶意访问，建议在公网部署时开启权限校验（用户名密码或Token认证）。
