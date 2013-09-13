##FIS-Chassis
[![NPM version](https://badge.fury.io/js/fis-chassis.png)](https://npmjs.org/package/fis-chassis)

> FIS-Chassis提供Chassis框架自动化脚手架开发的能力，为webapp提供开发上的便利。

## 快速上手

* 安装
    * npm install **-g** fis-chassis
* 三条命令，满足你的所有开发需求
    * fis-chassis install &lt;name&gt;
    * fis-chassis release &#91;options&#93;
    * fis-chassis server &lt;command&gt; &#91;options&#93;
    
    `fis-chassis`可以简化为`fisc`

## 示例演示

### 示例安装

```
fis-chassis install demo --repos http://webappdemos.duapp.com/scaffold
```

### 示例预览

开启本地预览服务：
```
fis-chassis server start --no-rewrite
```

发布到预览环境：
```
fis-chassis release
```

重新刷新浏览器即可看到效果。

## 编译开发

###初始化脚手架

如示例安装一样，你不需要从零开始创建一个webapp，工具已经提供了脚手架帮你做好了准备工作。

使用`fis-chassis install`命令安装脚手架：

```
fis-chassis install init --repos http://webappdemos.duapp.com/scaffold
```

如果目标目录为空，使用`fis-chassis release`命令时也可以自动下载脚手架：

```
md webapp
cd webapp
fis-chassis release

... ...
找不到fis-conf.js文件，当前项目不是chassis项目，需要安装chassis脚手架吗？
[N/Y]? y

选择脚手架名称：
1. init(最简单的脚手架，适合创建自己的项目)
2. demo(一个新闻app的完整示例)

【请选择】 : 2

... ...

脚手架安装成功，请重新执行release命令;

fis-chassis release

```

###目录结构介绍
```
.
│  fis-conf.js  //fis配置文件
│  index.html  //项目首页，可以自己指定其它名称
│  
├─css
│   all.css
│   app.css
│   globalloading.css
│   pageloading.css
│   reset.css
│      
├─data    //模拟数据目录
├─img  
├─js
│  │  chassis.config.js //[todo]待优化掉
│  │  init.js
│  │  pageview._TRANSITION_.js
│  │  
│  └─common
│      │ mod.js
│      ├─baidutemplate 
│      ├─chassis  
│      └─gmu
│                      
├─page
│  ├─detail
│  │  ├─css
│  │  │   detail.css
│  │  │      
│  │  ├─html
│  │  │   detail.html
│  │  │      
│  │  ├─js
│  │  │  └─view
│  │  │     pageview.detail.js
│  │  │     subview.detail_content.js
│  │  │          
│  │  └─tpl
│  │     detail.tpl
│  │          
│  └─index
│              
└─tpl
    globalloading.html
    pageloading.html
        
```
  
###新增Page

假如我们要新增一个名为`view`的Page，对应的路由规则是：

```
{ "view" : "view" }
```

只需要编辑配置文件`fis-conf.js`，在`Chassis.router.routes`下新增一条规则即可，如下：

```javascript
fis.config.merge({
    chassis : {
		home   : 'index.html',
		router : {
			"routes" : {
				""       : "index",
				"detail" : "detail",
				"view"   : "view"  //新增的路由规则
			},
			
			"defaultPageTransition" : "simple",
			
			"enablePositionRestore" : true,
			
			"pageTransition" : {
				"index-detail" : "slide"
			}
		}
	}
});
```

保存。

###重新编译

刚才新增的规则并没有建立对应的`page/view`目录，我们不需要手动建立它，使用`fis-chassis release`命令时会自动检测到这个新增的规则并处理它：

```
fis-chassis release

... ....

配置文件新增了一些路由规则，对应的目录及文件没有创建，需要创建吗？
[N/Y]? y

目录及文件创建成功，请重新执行release命令!

... ...
fis-chassis release
```

此时，即可预览到新增的`page`,而且，开发目录下已经自动生成了`page/view`目录及对应的脚手架模板，根据需要修改自己的业务逻辑即可。

###发布预览

```
fis-chassis release
```

##新增标签介绍

为了简化开发过程中的手工操作，工具在FIS的基础上新增了几个标签

###{{page.html}}

试用范围：任意html/css/js文件

工具在打包前会根据`fis-conf.js`设置的路由规则提取需要的`page`目录下的html文件内容替换掉当前标签。

###{{page.css}}

试用范围：任意html/css/js文件

工具在打包前会根据`fis-conf.js`设置的路由规则提取需要的`page`目录下的css文件内容替换掉当前标签。

###{{map.json}}

试用范围：任意html/css/js文件

工具在打包前会将`map.json`文件的内容替换当前标签。

###{{setting.router}}

试用范围：任意html/css/js文件

工具在打包前会将`fis-conf.js`的`chassis.router`节点的配置信息替换当前标签。

##关于前端模板

如果你在项目中使用了前端模板，一般需要选择一款合适的前端模板引擎。为了提高移动端前端模板解析的速度，工具提供模板预编译的功能，用于将前端模板编译为JS代码，同时配合`mod.js`提供的模块化能力，使得模板文件可以像`js`一样直接引用。

所以只需要根据`baiduTemplate`的模板语法直接创建模板文件即可。

##其它

`fis-chassis`仅在`fis-conf.js`的`Chassis.router.routes`规则新增时对开发目录下的`page`目录做新增操作。如果你删除了某些规则，工具不会删除对应的目录，但这个目录会变成孤立的目录，业务运行时不会被调用。


