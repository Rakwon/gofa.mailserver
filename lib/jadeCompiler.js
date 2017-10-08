let _jade   = require('jade');
let fs      = require('fs');


exports.compile = function(relativeTemplatePath, data, callback){

    let absoluteTemplatePath = process.cwd() +relativeTemplatePath+'.jade';
    console.log(absoluteTemplatePath);
    _jade.renderFile(absoluteTemplatePath, data, function(err, compiledTemplate){
        if(err)
            throw new Error('Problem compiling template(double check relative template path): ' + relativeTemplatePath);
        
            console.log('[INFO] COMPILED TEMPLATE: ', compiledTemplate)
            callback(null, compiledTemplate);
    });
}