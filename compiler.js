/*
 * JavaScript code compiler and minifier for the Node js platform
 *
 * The entire code was written in 2022 by Evgeny Kolibaba ( superjaba2000@gmail.com )
 *
 * version 2022-06-22
 *
 * This code was placed in the public domain by its original author,
 * Evgeny Kolibaba. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */
 
var mail_adress  = 'superjaba2000@gmail.com';
var github_site = 'https://github.com/SuperJaba2000/cucumber.js';

var compiler_version = '0.1.0';

var system_error_message = 'A serious error of the builder! If you have not changed the compiler code, then most likely the error is not caused by your actions. Please check the system requirements and install the latest version of the compiler. \n\n If this also does not help, please write to my email (${mail_adress}) and describe the problem!';
 
var show_system_errors = false;
 
try{
	
/* Node js imports */
const fileSystem = require('fs');
const pathModule = require('path');
const { performance } = require('perf_hooks');

const arguments = process.argv;

/* directory separator (depends on the operating system) */
const sep = pathModule.sep;
/* timestamp of the start of the build */
const start_time = performance.now();


/* error handling and output */
const onerror = ( errIndex ) => {
	console.error(`\x1b[31m Unexpected error! Index: [${errIndex}], "${error_indexes[errIndex]}" \x1b[0m`);
	return false;
};

const error_indexes = {
    [0x00]: 'configuration file not found',
	[0x01]: 'incorrect filling of the configuration file',
	[0x02]: 'source directory not found',
	[0x03]: 'output directory not found',
	
	[0x10]: 'unable to create/overwrite a build file',
	[0x11]: 'module list not found/empty',
	
	[0x20]: 'the module does not exist, or the path to it is specified incorrectly',
	[0x21]: 'incorrect module contents',
	
	[0x30]: 'it is not possible to add a module to the build'
};




/* 
 * --------------------------------------------------------------------------------------------------------
 *
 * Guide to filling out the configuration file 'build-settings.txt ':
 *
 * @param { string } raw_directory  - the path to the files to compile (relative),
 * @param { string } out_directory  - the path for the finished file (also relative),
 * @param { string } out_file       - name of the finished file (without extension),
 * 
 * @param { array }  modules        - array of modules to compile (path from 'raw_directory').
 *
 * --------------------------------------------------------------------------------------------------------
 *
 * @param { boolean } module search - modules will be assembled according to the source folder 
 * !!!(to activate, write the keyword 'search' instead of the first element in 'modules')!!!
 *
 * @param { array } ignore_list     - array of ignored files and folders (only if module search is enabled)
 * @param { array } extensions      - array of required module extensions(only if module search is enabled)
 *
 * @param { boolean } detailed_time - output split load/build time(not work now)
 *
 * --------------------------------------------------------------------------------------------------------
 */

var RAW_DIRECTORY, OUT_DIRECTORY, OUT_FILE, MODULES, IGNORE_LIST, DETAILED_TIME;




/* independent search for modules in the directory */
let findModules = ( path, ignore, extensions ) => {
	//path must be relative from %__dirname%
	var directory = `${__dirname}${sep}${RAW_DIRECTORY}${path}`;
	
	let raw_directory_exists = false;
	
	try{
	    raw_directory_exists = fileSystem.accessSync( `${directory}${sep}`, fileSystem.constants.F_OK );
	}catch(error){
		return onerror(0x02);
	}
	
	var directoryContent = fileSystem.readdirSync( directory, { encoding: 'utf8' } );
	
	let foundedModules = [];
	
	directoryContent.forEach(content => {
		if(!ignore.includes(content)){
            let contentExt = pathModule.extname(content);
		
            if(contentExt == ''){
			    let subDirectoryContent = findModules( `${path}${sep}${content}`, ignore, extensions );
			
			    foundedModules = foundedModules.concat(subDirectoryContent);
		    }else if( extensions.includes(contentExt) ){
			    foundedModules.push(`${path}${sep}${content}`);
		    }
		}
    });
	
	return foundedModules;
};

/* adding one module to the build */
let buildModule = ( module, module_data, callback, load_start_time ) => {
	//var build_start_time = 
	
	if(!module_data){
		callback(module);
		return false;
	}
	
	let moduleError = ( errIndex ) => {
	    console.error('\x1b[31m', '  Module', '\x1b[91m', `"${module}"`, '\x1b[31m', `build error!  Index: [${errIndex}], "${error_indexes[errIndex]}"`, '\x1b[0m');
		callback(module);
		
		return false;
    };
	
	let out_file_exists = false;
	
	try{
	    out_file_exists = fileSystem.accessSync( `${__dirname}${sep}${OUT_DIRECTORY}${sep}${OUT_FILE}`, fileSystem.constants.F_OK )
	}catch(error){
		return onerror(0x10);
	}
	
	/* adding code from a module to a build file */
	fileSystem.appendFile(`${__dirname}${sep}${OUT_DIRECTORY}${sep}${OUT_FILE}`, module_data, {encoding: 'utf8'}, (err) => {
	    if(err) return onerror(0x30);
    });
	
	console.log(`\x1b[35m  Module \x1b[32m"${module}"\x1b[35m builded. \x1b[0m`);
	
	/* compile-time output if the module was last */
	if(module == MODULES[MODULES.length - 1]){
		console.log('\x1b[36m', `\n Building end! Build time: ${(performance.now() - start_time).toFixed(2)}ms.`, '\x1b[0m');
	}else{
	    callback(module);
	}
};

/* loading one module */
let loadModule = ( module, callback ) => {
	var module_data = null;
	
	let moduleError = ( errIndex ) => {
		console.error(`\x1b[91m Module \x1b[0m \x1b[31m "${module}" \x1b[91m load error! Index: [${errIndex}], "${error_indexes[errIndex]}" \x1b[0m`);
		callback(module);
		
		return false;
    };
	
	/* checking the existence of the module file */
	fileSystem.access(`${__dirname}${sep}${RAW_DIRECTORY}${sep}${module}`, fileSystem.constants.F_OK, (err) => {
        if(err) return moduleError(0x20);
		
		/* reading the code from the module */
		fileSystem.readFile(`${__dirname}${sep}${RAW_DIRECTORY}${sep}${module}`, 'utf8', ( err, data ) => {
		    if(err) moduleError(0x21);
			
			module_data = data;
			
		    buildModule(module, module_data, callback);
	    });
	});
};

console.log(`\x1b[35m Cucumber start. Compiler version: ${compiler_version} \x1b[0m \n`);

/* loading a JSON configuration from a file 'build-settings.txt' */
fileSystem.readFile(`${__dirname}${sep}build-settings.txt`, 'utf8', ( err, data ) => {
	if(err) return onerror(0x00);
	
	console.log(`\x1b[92m Loading the configaration... \x1b[0m`);
	
	let settings = {};
	
	try{
	    settings = JSON.parse(data);
	}catch(error){ 
	    return onerror(0x01);
	}
	
	RAW_DIRECTORY = settings.raw_directory;
	OUT_DIRECTORY = settings.out_directory;
	OUT_FILE      = settings.out_file      || 'ready_build.js';
	
	MODULES       = settings.modules       || [];
	
	IGNORE_LIST   = settings.ignore_list   || [];
	
	DETAILED_TIME = settings.modules       || false;
	
	
	
	IGNORE_LIST.push('compiler.js');
	
	if(MODULES[0] == 'search')
	    MODULES = findModules( '', IGNORE_LIST, (settings.extensions || ['.js']) );
	
	let out_directory_exists = false;
	
	try{
	    out_directory_exists = fileSystem.accessSync( `${__dirname}${sep}${OUT_DIRECTORY}`, fileSystem.constants.F_OK );
	}catch(error){
		return onerror(0x03);
	}
	
	/* clearing a file with an old build */
	fileSystem.writeFile(`${__dirname}${sep}${OUT_DIRECTORY}${sep}${OUT_FILE}`, '', { encoding: 'utf8' }, ( err ) => {
	    if(err) return onerror(0x10);

        if(!MODULES.length)
			return onerror(0x11);
		
		console.log('\x1b[92m',`\n Loading modules: \n`, '\x1b[0m');
		
		let loadNext = ( module ) => {
			let moduleIndex = MODULES.indexOf(module);
			
			if(moduleIndex == MODULES.length - 1)
				return false;
			
			loadModule(MODULES[moduleIndex+1], loadNext);
		};
		
		let firstModule = MODULES[0];
		loadModule(firstModule, loadNext);
    });
});

//while(loaded == 0 || loaded < MODULES.length){
//	if((performance.now() - start_time) >= 10*1000)
//		throw new Error('Too long building!');
//}

}catch(ultra_error){
	if(show_system_errors)
	    console.error(ultra_error);
	
	console.error(`\n\n \x1b[91m ${system_error_message} \x1b[0m \n`);
}