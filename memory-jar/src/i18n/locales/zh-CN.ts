const messages = {
  'app.tagline': '存入一切，随时召回',

  'auth.loginPrompt': '请登录',

  'nav.chat': '对话',
  'nav.documents': '文档',
  'nav.history': '历史记录',
  'nav.recentChats': '最近对话',

  'chat.title': '对话',
  'chat.subtitle': '优先检索你的文档，也支持日常问答',
  'chat.placeholder': '问待办、笔记内容，或任何日常问题…',
  'chat.send': '发送',
  'chat.loading': '正在检索并生成回答…',
  'chat.mockReply': '这是模拟回答。接入后端后，将基于你的文档内容生成真实回复。',

  'documents.title': '我的文档',
  'documents.subtitle': '管理你上传的文档记忆',
  'documents.upload': '上传文档',
  'documents.deleteAria': '删除文档',
  'documents.empty': '暂无文档，点击「上传文档」添加你的第一份记忆',
  'documents.uploadPreview': '已上传文件（{size} KB），内容将在接入后端后自动索引。',
  'documents.acceptHint': '.txt、.md、.pdf、.doc、.docx、.json、.xml、.csv、.xlsx',

  'history.title': '历史记录',
  'history.subtitle': '查看过去的对话记录',

  'upload.title': '上传文件',
  'upload.dropzoneHint': '点击选择文件，或拖拽到此处',
  'upload.confirm': '上传',
  'upload.cancel': '取消',
  'upload.selected': '已选择：',
  'upload.acceptFormats': '支持 {formats}',

  'locale.zh': '中文',
  'locale.en': 'English',
} as const

export default messages
