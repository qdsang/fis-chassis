/**
 * @author xspider.org@gmail.com
 */

var fis = module.exports = require('fis'),
	fs  = require( 'fs' ),
	program = require('commander');

fis.cli.name = "fis-chassis";
fis.cli.info = fis.util.readJSON(__dirname + '/package.json');

fis.config.merge({
    modules : {
		
        postpackager : function( ret ){
			var project         = process.cwd().replace( /\\/g, '/' ),
				setting         = fis.config.get('chassis'),
				install_page    = [],
				scaffold,
				stdin,
				conf;

			// 检查当前目录是否为空.如果为空就需要重新install
			if ( !fis.util.isFile( project + '/fis-conf.js') ) {
				
				// 使用setTimeout让fis的时间输入提前输出，防止对命令行的干扰
				setTimeout(function(){
					process.stdout.write( ("\n找不到fis-conf.js文件，当前项目不是chassis项目，需要安装chassis脚手架吗？\n").bold.red );
					
					program.confirm('[N/Y]? ', function(ok){
						if ( !ok ) {
							process.exit( 1 );
							process.stdin.destroy();
							return;
						}
						
						process.stdout.write( ("\n选择脚手架名称：\n").bold.red + "1. init(最简单的脚手架，适合创建自己的项目)\n2. demo(一个新闻app的完整示例)\n" );
						
						program.prompt('[请选择]: ', function(desc){
							scaffold = desc.trim().toLowerCase() === '1' ? 'init' : 'demo';
							
							fis.util.install( scaffold, '*', {
								extract : project,
								remote  : 'http://webappdemos.duapp.com/scaffold',
								before  : function(name, version){},
								done    : function() {
									process.stdout.write( ("\n脚手架安装成功，请重新执行release命令;\n").bold.green );
									process.stdin.destroy();
								}
							} );
						});
					});
				},300);
				return false;
			}
			
			// 检查对应的page是否存在，如果不存在就拉取
			fis.util.map( setting.router.routes, function( key, value ) {
				var dir = project + '/page/' + value;
				if( fis.util.isDir( dir ) ){
					return;
				}
				
				install_page.push( value );
				
			} );
			

			if ( install_page.length ) {
				
				// 使用setTimeout让fis的时间输入提前输出，防止对命令行的干扰
				setTimeout(function(){
				
					process.stdout.write( ("\n配置文件新增了一些路由规则，对应的目录及文件没有创建，需要创建吗？\n").bold.red );
					
					program.confirm('[N/Y]? ', function(ok){
						if ( !ok ) {
							process.exit( 1 );
							process.stdin.destroy();
							return;
						}
						
						// 执行安装
						var tmpDir = project + '/.chassis-tmp';
						fis.util.mkdir( tmpDir );
						fis.util.install( 'pagetpl', '*', {
							extract : tmpDir,
							remote  : 'http://webappdemos.duapp.com/scaffold',
							before  : function(name, version){},
							done    : function() {
								copyTmp( tmpDir, install_page );
								removeDir( tmpDir );
								process.stdout.write( ("\n目录及文件创建成功，请重新执行release命令!\n").bold.green );
								
								process.stdin.destroy();
							}
						} );
					
					});
					
					
					
					
					// 建立目标目录
					var copyTmp = function( path, pages ){
						pages.forEach( function( item ) {
							fis.util.mkdir( project + '/page/' + item );
						} );
						
						walk( path, pages );
					};
					
					var walk = function( path, pages ){
						var dirList = fs.readdirSync( path );

						dirList.forEach( function( item ) {
							var dir = path + '/' + item;
							if ( fis.util.isDir( dir ) ) {
								pages.forEach( function( p ) {
									var _path = dir.replace( '.chassis-tmp', '/page/' + p ).replace( /\{pagename\}/g, p );
									fis.util.mkdir( _path );
								} );
								walk( dir, pages );
							} else {
								pages.forEach( function( p ) {
									var _path = dir.replace( '.chassis-tmp', '/page/' + p ).replace( /\{pagename\}/g, p );
									fis.util.copy( dir,  _path);
									var content = fis.util.read( dir ).replace( /\{pagename\}/g, p );
									fis.util.write( _path, content );
								} );
							}
						} );
					};
					
					var removeDir = function( path ){
						var files = [];
						if( fs.existsSync( path ) ) {
							files = fs.readdirSync( path );
							files.forEach( function( file, index ) {
								var curPath = path + "/" + file;

								if( fis.util.isDir( curPath ) ) {
									removeDir( curPath );
								} else {
									fs.unlinkSync( curPath );
								}

							} );

							fs.rmdirSync( path );
						}
					};
				
				
				}, 300);
				return false;
				
			}
			
			
			
			
			// 合并相关的html文件/CSS文件
			// 合并map.json到首页
			var htmlContent     = '',
				cssContent      = '';
			
			
			fis.util.map( setting.router.routes, function( key, value ) {
				
				htmlContent += ret.ids[ 'page/' + value + '/html/' + value + '.html' ].getContent();
				cssContent  += ret.ids[ 'page/' + value + '/css/' + value + '.css' ].getContent();
			} );

			// 对所有的文件做自定义内置标记替换
			fis.util.map( ret.ids, function( key, value ){
				var f = value,
					c = f.getContent();
					
				c = c
					 .replace( /\{\{page\.css\}\}/g, cssContent )
					 .replace( /\{\{page\.html\}\}/g, htmlContent )
					 .replace( /\{\{map\.json\}\}/g, JSON.stringify(ret.map) )
					 .replace( /\{\{setting\.router\}\}/g, JSON.stringify( setting.router ) );
				
				f.setContent( c );
			} );
			
			
			return true;
		},
		parser : {
			tpl    : 'bdtmpl-chassis',
			md     : 'marked'
        }
    },
    settings : {
        postprocessor : {
            jswrapper : {
                type : 'amd'
            }
        }
    },
    roadmap : {
        ext : {
			tpl : 'js',
			md  : 'html'
        },
        domain : 'http://fis.baidu.com',
        path : [
            {
                reg : 'map.json',
                release : 'map.json'
            },
			{
                reg : '**\.html',
				isMod : true,
                release : '/$&'
            },
						
			{
                reg : '**\.css',
                isMod : true,
                release : '/$&'
            },
            {
                reg : 'router.json',
                release : false
            },
			
			{
                reg : 'js/common/mod.js',
                
                isMod : false,
                
                release : '/js/common/mod.js'
            },
			{
                
                reg : 'js/common/gmu/js/zepto.js',
                
                isMod : false,
                
                release : '/js/common/gmu/js/zepto.js'
            },
			{
                
                reg : 'js/common/gmu/js/zepto.extend.js',
                
                isMod : false,
                
                release : '/js/common/gmu/js/zepto.extend.js'
            },
			{
                
                reg : 'js/common/chassis/chassis.js',
                
                isMod : false,
                
                release : '/js/common/chassis/chassis.js'
            },
			{
                
                reg : 'js/rocket-chassis-bridge.js',
                
                isMod : false,
                
                release : '/js/rocket-chassis-bridge.js'
            },
			{
                reg : 'js/**\.js',
				isMod : true,
                release : '/$&'
            },
			{
                
                reg : 'page/**\.js',
                
                isMod : true,
                
                release : '/$&'
            },
			{
                
                reg : 'page/**\.tpl',
                
                isMod : true,
                
                release : '/$&'
            }
        ]
    },

    pack : {
		/*
        'pkg/all.js' : [
            'js/common/gmu/js/zepto.js',
            'js/common/gmu/js/zepto.extend.js',
			'js/common/chassis/chassis.js',
			'js/common/mod.js',
            'js/common/baidutemplate/baidutemplate.js'
        ],
        'pkg/all.css' : [
            'js/**.css',
            'page/**.css'
        ]
		*/
    }
});
