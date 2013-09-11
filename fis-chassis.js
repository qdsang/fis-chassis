/**
 * @author xspider.org@gmail.com
 */

var fis = module.exports = require('fis'),
	fs  = require( 'fs' );

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
				process.stdout.write( ("fis-conf.js is not found,do you want to install a new scaffold?").bold.red + "[N/Y]" );
				stdin = fs.readSync(process.stdin.fd, 1000, 0, "utf8");
				
				if ( stdin[ 0 ].trim().toLowerCase() !== 'y' ) {
					process.exit( 1 );
				}
				
				process.stdout.write( ("press scaffold name to continue,default is init").bold.red + "[init]" );
				stdin = fs.readSync(process.stdin.fd, 1000, 0, "utf8");
				
				scaffold = stdin[ 0 ].trim().toLowerCase() === 'demo' ? 'demo' : 'init';
				
				fis.util.install( scaffold, '*', {
					extract : project,
					remote  : 'http://webappdemos.duapp.com/scaffold',
					before  : function(name, version){},
					done    : function() {
						process.stdout.write( ("\nscaffold install successly, please release it again;\n").bold.green );
					}
				} );
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
			
				process.stdout.write( ("some page is lost,do you want to install it?").bold.red + "[N/Y]" );
				
				stdin = fs.readSync(process.stdin.fd, 1000, 0, "utf8");
				
				if ( stdin[ 0 ].trim().toLowerCase() !== 'y' ) {
					process.exit( 1 );
				}
				
				
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
						process.stdout.write( ("\npage install success, please release it again;\n").bold.green );
					}
				} );
				
				return;
				
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
			} )
			
			
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
