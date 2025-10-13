# 🖼️ Unsplash API 设置指南

## 获取Unsplash API密钥

### 1. 注册Unsplash开发者账户
1. 访问 [https://unsplash.com/developers](https://unsplash.com/developers)
2. 点击 "Register as a developer"
3. 填写申请信息
4. 等待审核通过（通常几分钟到几小时）

### 2. 创建应用程序
1. 登录后点击 "New Application"
2. 填写应用信息：
   - Application name: "Airbnb Clone Demo"
   - Description: "Demo application for showcasing property listings"
3. 获取 Access Key

### 3. 配置环境变量
在项目根目录创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="mongodb://localhost:27017/airbnb-clone"

# NextAuth 配置
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Unsplash API配置
UNSPLASH_ACCESS_KEY="your-unsplash-access-key-here"
```

### 4. 运行脚本
```bash
node unsplash-images.js
```

## 脚本功能

### 获取的图片类型
- **apartment** - 公寓
- **loft** - 阁楼
- **beach house** - 海滩别墅
- **modern home** - 现代住宅
- **studio** - 工作室
- **cabin** - 小屋
- **villa** - 别墅
- **penthouse** - 顶层公寓
- **townhouse** - 联排别墅
- **mansion** - 豪宅
- **cottage** - 乡村小屋
- **bungalow** - 平房
- **condo** - 公寓
- **duplex** - 复式住宅
- **farmhouse** - 农舍
- **colonial** - 殖民风格
- **contemporary** - 当代风格
- **minimalist home** - 极简主义住宅
- **luxury home** - 豪华住宅
- **cozy home** - 舒适住宅
- **rustic home** - 乡村风格住宅
- **urban home** - 城市住宅
- **suburban home** - 郊区住宅
- **mountain home** - 山景住宅
- **lake house** - 湖景住宅
- **city apartment** - 城市公寓
- **downtown loft** - 市中心阁楼

### 图片质量
- **分辨率**: 高质量图片
- **方向**: 横向图片
- **来源**: 专业摄影师作品
- **授权**: 免费商业使用

### 数据统计
- **图片数量**: 200+ 张
- **关键词**: 30+ 个房源类型
- **质量**: 专业摄影作品
- **多样性**: 涵盖各种房源类型

## 注意事项

1. **API限制**: Unsplash免费版有请求限制
2. **图片质量**: 所有图片都是高质量专业摄影
3. **版权**: 图片遵循Unsplash许可证
4. **延迟**: 脚本包含延迟以避免API限制

## 运行结果

脚本将：
1. 从Unsplash获取200+张高质量房源图片
2. 创建对应的房源数据
3. 存储到MongoDB数据库
4. 在前端显示真实房源图片

这样您就能看到真实的、多样化的房源图片了！


