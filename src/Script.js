// ECMA262【脚本】执行

//脚本执行任务
function ScriptEvaluationJob(sourceText, hostDefine) {
    //断言：sourceText是ECMAScript源文本

    //通过领域解析脚本
    let realm = this.ExecutionContext.Realm.RealmRecord
    let s = ParseScript(sourceText, realm, hostDefine)

    //解析失败则中断
    if (!s) throw err

    //执行脚本
    return ScriptEvaluation(s)
}

//解析脚本
function ParseScript(sourceText, realm, hostDefine) {
    //断言：sourceText是ECMAScript源文本

    //脚本解析，返回抽象语法树和声明列表
    let body = parse(sourceText) = {
        ...AST,
        StatementList: {
            IsStrict: true,//是否使用严格模式
            LexicallyDeclaredNames: [],//顶层词法声明的命名列表
            LexicallyScopedDeclarations: [],//顶层词法作用域声明的命名列表
            VarDeclaredNames: [],//顶层变量声明的命名列表
            VarScopedDeclarations: [],//顶层变量声明的命名列表
        }
    }

    //解析早期错误
    //如果词法声明有重复
    //如果词法声明同时出现在变量声明中
    //如果声明列表包含super
    //如果声明列表包含newTarget
    //如果包含参数的声明有重复的label
    //如果包含参数的声明有未定义的break
    //如果包含参数的声明有未定义的continue
    //出现以上情况则抛出语法错误
    body = EarlyErrors(body)
    if (!body) throw err

    //返回一个脚本记录
    return new ScriptRecords({
        "[[Realm]]": realm,
        "[[Environment]]": undefined,
        "[[ECMAScriptCode]]": body,
        "[[HostDefined]]": hostDefine,
    })
}

//执行脚本
function ScriptEvaluation(scriptRecord) {
    //获取领域定义的【全局环境】
    let globalEnv = scriptRecord["[[Realm]]"]["[[GlobalEnv]]"]

    //通过脚本记录和全局环境初始化一个新的【执行上下文】
    let scriptCxt = new ExecutionContext()
    scriptCxt.Function = null
    scriptCxt.Realm = scriptRecord["[[Realm]]"]
    scriptCxt.ScriptOrModule = scriptRecord
    scriptCxt.VariableEnvironment = globalEnv
    scriptCxt.LexicalEnvironment = globalEnv

    //【挂起】当前的执行上下文
    Suspend()

    //将新的执行上下文推入执行上下文堆栈并执行
    ExecutionContextStack.push(scriptCxt)

    //【执行】脚本
    let scriptBody = scriptRecord["[[ECMAScriptCode]]"]

    //当为脚本建立执行上下文时，将在当前全局环境中实例化声明。【实例化】代码中声明的每个全局绑定。
    let result = GlobalDeclarationInstantiation(scriptBody, globalEnv)

    //如果返回结果不是错误，则保存结果
    if (result) scriptBody.result = result

    //【中断】当前执行上下文
    Suspend()

    //将当前执行上下文【移出】堆栈
    ExecutionContextStack.pop()

    //断言：当前执行上下文堆栈不为空

    //【恢复】挂起的执行上下文
    Resume()

    return true
}

//在全局上下文环境中实例化标识符声明
function GlobalDeclarationInstantiation(script, env) {
    //获取【环境记录】
    let envRec = env.EnvironmentRecord

    //断言：envRec是一个全局环境记录

    //遍历【词法声明】，检查是否出现【语法错误】
    let lexNames = script.LexicallyDeclaredNames
    lexNames.forEach(name => {
        //如果环境记录中已经存在name的词法声明，抛出语法错误
        if (envRec.HasVarDeclaration(name) === true) throw SyntaxError
        //如果环境记录中已经存在name的变量声明，抛出语法错误
        if (envRec.HasLexicalDeclaration(name) === true) throw SyntaxError
        //如果环境记录中已经存在name的保留字，抛出语法错误
        let hasRestrictedGlobal = envRec.HasRestrictedGlobalProperty(name)
        if (hasRestrictedGlobal === true) throw SyntaxError
    })

    //遍历【变量声明】，检查是否与【环境记录】中的【词法声明】冲突
    let varNames = script.VarDeclaredNames
    varNames.forEach(name => {
        //如果环境记录中已经存在name的词法声明，抛出语法错误
        if (envRec.HasLexicalDeclaration(name) === true) throw SyntaxError
    })

    //初始化一个【待初始化的方法列表】
    let functionsToInitialize = []
    //初始化一个【方法声明列表】
    let declaredFunctionNames = []

    //遍历【变量声明】（因为【方法声明】包含在【变量声明】中），并将可以初始化的方法推入【待初始化方法列表】和【方法声明列表】
    let varDeclarations = script.VarScopedDeclarations
    varDeclarations.forEach(d => {
        //如果d不是一个变量声明且不是一个标识符绑定
        if (d !== VariableDeclaration && d !== BindingIdentifier) {
            //断言：d是一个方法声明，一个构造函数声明，异步函数声明或异步构造函数声明
            //如果声明绑定的对象不在方法声明列表中
            let fn = d.BoundNames.fn 
            if(declaredFunctionNames.some(fn) === false){
                //判断是否可以声明全局方法
                let fnDefinable = envRec.CanDeclareGlobalFunction(fn)
                //不行则抛出类型错误
                if(fnDefinable === false) throw TypeError
                //将fn推入方法声明列表
                declaredFunctionNames.push(fn)
                //将fn推入待初始化方法列表
                functionsToInitialize.push(d)
            }
        }
    })

    //初始化一个变量声明列表
    let declaredVarNames = []
    //遍历变量作用域列表并将可以声明的名称推入列表
    varDeclarations.forEach(d=>{
        //如果d是一个变量声明或绑定或标识符绑定
        if(d === VariableDeclaration || d===ForBinding || d===BindingIdentifier){

            //遍历d所绑定的名称列表
            d.BoundNames.forEach(vn=>{

                //判断是否可以声明全局变量
                let vnDefinable = envRec.CanDeclareGlobalVar(vn)

                //不行则抛出类型错误
                if(vnDefinable === false) throw TypeError

                //如果变量声明列表中没有包含vn，则将其推入列表
                if(declaredVarNames.some(vn) === false) declaredVarNames.push(vn)
            })
        }
    })

    //获取是否使用严格模式
    let strict = script.IsStrict
    //如果不使用严格模式，将声明中的所有变量提升至全局作用域
    if(strict === false){
        //初始化一个方法或变量声明列表
        let declaredFunctionOrVarNames = []

        //将方法声明和变量声明合并到方法或变量声明列表
        declaredFunctionOrVarNames = declaredFunctionOrVarNames.concat(declaredFunctionNames)
        declaredFunctionOrVarNames = declaredFunctionOrVarNames.concat(declaredVarNames)

        //遍历脚本声明列表
        script.StatementList.forEach(f=>{

            //获取声明的标识符绑定
            let F = f.BindingIdentifier

            //如果将f替换为一个含有f标识符绑定的标量声明，且不会引发早期作物
            if(EarlyErrors(f=VariableStatement(F))){

                //且上下文环境也不包含F的词法声明
                if(envRec.HasLexicalDeclaration(F) === false){

                    //判断是否可以声明变量
                    let fnDefinable = envRec.CanDeclareGlobalVar(F)

                    //如果可以声明
                    if(fnDefinable === true){

                        //且原方法或变量声明列表中没有不存在F的绑定
                        if(declaredFunctionOrVarNames.some(F) === false){

                            //创建全局变量绑定F
                            envRec.CreateGlobalVarBinding(F, false)

                            //方法或变量声明列表推入F
                            declaredFunctionOrVarNames.push(F)
                        }
                        //当f执行的时候，将返回F的绑定
                    }
                }
            }
        })
    }

    //变量词法作用域声明，为不同的声明创建可变/不可变绑定
    let lexDeclarations = script.LexicallyScopedDeclarations
    lexDeclarations.forEach(d=>{
        //遍历每个声明绑定的名称列表
        d.BoundNames.forEach(dn=>{
            //如果是被const定义的常量，则在上下文环境中创建不可变绑定
            if(IsConstantDeclaration(d) === true) envRec.CreateImmutableBinding(dn, true)
            //否则在上下文环境中创建可变绑定
            else envRec.CreateMutableBinding(dn, false)
        })
    })

    //遍历待初始化的方法列表，在上下文环境中创建全局方法绑定
    functionsToInitialize.forEach(f=>{
        let fn = f.BoundNames.fn
        //创建实例化方法对象
        let fo = f.InstantiateFunctionObject(env)
        //在上下文环境中通过解析后的方法和实例化的方法对象创建全局方法绑定
        envRec.CreateGlobalFunctionBinding(fn, fo, false)
    })

    //遍历变量声明名称列表，在上下文环境中创建全局变量绑定
    declaredVarNames.forEach(vn=>{
        envRec.CreateGlobalVarBinding(vn, false)
    })
    return true
}