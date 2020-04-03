// ECMA262【脚本】执行

//脚本执行任务
function ScriptEvaluationJob(sourceText, hostDefine){
    //断言：sourceText是ECMAScript源文本
    let realm = this.ExecutionContext.Realm.RealmRecord
    let s = ParseScript(sourceText, realm, hostDefine)
    if(!s) throw err
    return ScriptEvaluation(s)
}

//解析脚本
function ParseScript(sourceText, realm, hostDefine){
    //断言：sourceText是ECMAScript源文本
    let body = parse(sourceText) = {
        ...AST,
        StatementList:{
            IsStrict: true,
            LexicallyDeclaredNames: [],
            LexicallyScopedDeclarations: [],
            VarDeclaredNames: [],
            VarScopedDeclarations: [],
        }
    }
    body = EarlyErrors(body)
    if(!body) throw err
    return new ScriptRecords({
        "[[Realm]]":realm,
        "[[Environment]]":undefined,
        "[[ECMAScriptCode]]":body,
        "[[HostDefined]]":hostDefine,
    })
}

//执行脚本
function ScriptEvaluation(scriptRecord){
    let globalEnv = scriptRecord["[[Realm]]"]["[[GlobalEnv]]"]
    let scriptCxt = new ExecutionContext()
    scriptCxt.Function = null
    scriptCxt.Realm = scriptRecord["[[Realm]]"]
    scriptCxt.ScriptOrModule  = scriptRecord
    scriptCxt.VariableEnvironment = globalEnv
    scriptCxt.LexicalEnvironment = globalEnv
    Suspend()
    ExecutionContextStack.push(scriptCxt)
    let scriptBody = scriptRecord["[[ECMAScriptCode]]"]
    let result = GlobalDeclarationInstantiation(scriptBody,globalEnv)
    if(result) scriptBody.result = result
    Suspend()
    //断言：当前执行上下文堆栈不为空
    Resume()
    return true
}

//在全局上下文环境中实例化标识符声明
function GlobalDeclarationInstantiation(script, env){
    let envRec = env.EnvironmentRecord
    //断言：envRec是一个全局环境记录
    let lexNames = script.LexicallyDeclaredNames
    let varNames = script.VarDeclaredNames
    lexNames.forEach(name=>{
        if(envRec.HasVarDeclaration(name) === true) throw SyntaxError
        if(envRec.HasLexicalDeclaration(name) === true) throw SyntaxError
        let hasRestrictedGlobal = envRec.HasRestrictedGlobalProperty(name)
        if(hasRestrictedGlobal === true) throw SyntaxError
    })
    varNames.forEach(name=>{
        if(envRec.HasLexicalDeclaration(name) === true) throw SyntaxError
    })
    let varDeclarations = script.VarScopedDeclarations
    let functionsToInitialize = []
    varDeclarations.forEach(d=>{
        
    })
}