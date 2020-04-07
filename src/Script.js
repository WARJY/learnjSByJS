// ECMA262【脚本】评估
// 入口为ScriptEvaluationJob并推入脚本任务队列

// 脚本解析分为三个阶段：【解析】，【评估】和【实例化】
// 1.解析（ParseScript）：将源文本解析为抽象语法树，并初始化语句列表，分析语法错误
// 2.评估（ScriptEvaluation）：初始化执行上下文和环境记录
// 3.实例化（GlobalDeclarationInstantiation）：向环境记录中添加变量声明和函数声明绑定

//【脚本评估】任务
function ScriptEvaluationJob(sourceText, hostDefine) {
    //断言：sourceText是ECMAScript源文本

    //通过领域解析脚本
    let realm = this.ExecutionContext.Realm.RealmRecord
    let s = ParseScript(sourceText, realm, hostDefine)

    //解析失败则中断
    if (!s) throw err

    //评估脚本
    return ScriptEvaluation(s)
}

//脚本【解析】
function ParseScript(sourceText, realm, hostDefine) {
    //断言：sourceText是ECMAScript源文本

    //脚本解析，返回抽象语法树和语句列表
    let body = parse(sourceText) = {
        ...AST,
        StatementList: {
            IsStrict: true,//是否使用严格模式
            LexicallyDeclaredNames: [],//顶层词法声明的命名列表
            LexicallyScopedDeclarations: [],//顶层词法作用域声明的命名列表
            VarDeclaredNames: [],//顶层变量声明的命名列表
            VarScopedDeclarations: [],//顶层变量作用域声明的命名列表
        }
    }

    //解析早期错误
    //如果词法声明有重复
    //如果词法声明同时出现在变量声明中
    //如果声明列表包含super
    //如果声明列表包含newTarget
    //如果语句有重复的label
    //如果语句有未定义的break
    //如果语句有未定义的continue
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

//脚本【评估】
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

    //【挂起】当前的执行上下文并将新的执行上下文推入执行上下文堆栈执行
    Suspend()
    ExecutionContextStack.push(scriptCxt)

    //在当前全局环境中【实例化】代码中声明的每个全局绑定并执行
    let scriptBody = scriptRecord["[[ECMAScriptCode]]"]
    let result = GlobalDeclarationInstantiation(scriptBody, globalEnv)

    //如果返回结果不是错误，则保存结果
    if (result) scriptBody.result = result

    //【中断】当前执行上下文并移出堆栈
    Suspend()
    ExecutionContextStack.pop()

    //断言：当前执行上下文堆栈不为空

    //【恢复】挂起的执行上下文
    Resume()

    return true
}

//脚本上下文环境中【实例化】标识符声明
function GlobalDeclarationInstantiation(script, env) {
    //获取【环境记录】
    let envRec = env.EnvironmentRecord

    //断言：envRec是一个全局环境记录

    //遍历【词法声明】，检查是否重复声明
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
        if (envRec.HasLexicalDeclaration(name) === true) throw SyntaxError
    })

    //遍历【变量作用域声明】，并将其中可以声明的【函数声明】推入【待初始化函数列表】和【函数声明列表】
    let functionsToInitialize = []
    let declaredFunctionNames = []
    let varDeclarations = script.VarScopedDeclarations
    varDeclarations.forEach(d => {
        //如果d不是一个变量声明且不是一个标识符绑定
        if (d !== VariableDeclaration && d !== BindingIdentifier) {
            //断言：d是一个函数声明，一个构造函数声明，异步函数声明或异步构造函数声明

            //如果声明绑定的对象不在函数声明列表中
            let fn = d.BoundNames.fn
            if(declaredFunctionNames.some(fn) === false){
                //判断是否可以声明全局函数
                let fnDefinable = envRec.CanDeclareGlobalFunction(fn)
                if(fnDefinable === false) throw TypeError
                //将fn推入函数声明列表
                declaredFunctionNames.push(fn)
                //将d推入待初始化函数列表
                functionsToInitialize.push(d)
            }
        }
    })

    //遍历【变量声明】并将可以声明的【变量】名称推入【变量声明列表】
    let declaredVarNames = []
    varDeclarations.forEach(d=>{
        //如果d是一个变量声明或绑定或标识符绑定
        if(d === VariableDeclaration || d===ForBinding || d===BindingIdentifier){
            //遍历d所绑定的名称列表
            d.BoundNames.forEach(vn=>{
                //判断是否可以声明全局变量
                let vnDefinable = envRec.CanDeclareGlobalVar(vn)
                if(vnDefinable === false) throw TypeError
                //如果变量声明列表中没有包含vn，则将其推入列表
                if(declaredVarNames.some(vn) === false) declaredVarNames.push(vn)
            })
        }
    })

    //获取是否使用【严格模式】，如果不使用严格模式，将语句中的变量提升至全局作用域
    let strict = script.IsStrict
    if(strict === false){
        let declaredFunctionOrVarNames = []

        //将函数声明和变量声明合并到函数或变量声明列表
        declaredFunctionOrVarNames = declaredFunctionOrVarNames.concat(declaredFunctionNames)
        declaredFunctionOrVarNames = declaredFunctionOrVarNames.concat(declaredVarNames)

        //遍历脚本语句列表并替换全局变量绑定
        script.StatementList.forEach(f=>{
            //获取声明的标识符绑定
            let F = f.BindingIdentifier
            //如果将f替换为一个含有f标识符绑定的变量语句，且不会引发早期错误
            if(EarlyErrors(f=VariableStatement(F))){
                //且上下文环境也不包含F的词法声明
                if(envRec.HasLexicalDeclaration(F) === false){
                    //判断是否可以声明变量
                    let fnDefinable = envRec.CanDeclareGlobalVar(F)
                    //如果可以声明
                    if(fnDefinable === true){
                        //且原函数或变量声明列表中没有不存在F的绑定
                        if(declaredFunctionOrVarNames.some(F) === false){
                            //创建全局变量绑定F
                            envRec.CreateGlobalVarBinding(F, false)
                            //函数或变量声明列表推入F
                            declaredFunctionOrVarNames.push(F)
                        }
                        //当f执行的时候，将返回F的绑定
                    }
                }
            }
        })
    }

    //遍历【词法作用域声明】，为不同的声明创建可变/不可变绑定
    let lexDeclarations = script.LexicallyScopedDeclarations
    lexDeclarations.forEach(d=>{
        d.BoundNames.forEach(dn=>{
            //如果是被const定义的常量，则在上下文环境中创建不可变绑定
            if(IsConstantDeclaration(d) === true) envRec.CreateImmutableBinding(dn, true)
            //否则在上下文环境中创建可变绑定
            else envRec.CreateMutableBinding(dn, false)
        })
    })

    //遍历【待初始化的函数列表】，在上下文环境中创建全局函数绑定
    functionsToInitialize.forEach(f=>{
        let fn = f.BoundNames.fn
        //创建实例化函数对象
        let fo = f.InstantiateFunctionObject(env)
        //在上下文环境中通过解析后的函数和实例化的函数对象创建全局函数绑定
        envRec.CreateGlobalFunctionBinding(fn, fo, false)
    })

    //遍历【变量声明列表】，在上下文环境中创建全局变量绑定
    declaredVarNames.forEach(vn=>{
        envRec.CreateGlobalVarBinding(vn, false)
    })

    return true
}

module.exports = ScriptEvaluationJob