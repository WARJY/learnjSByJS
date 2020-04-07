// ECMA262【模块】执行
// 入口为TopLevelModuleEvaluationJob，并推入脚本任务队列

// 模块执行分为四个阶段：【解析】，【实例化】，【评估】，【执行】
// 1.解析（ParseScript）：解析模块并生成一条模块记录
// 2.实例化（Instantiate）：递归调用模块实例化，并初始化执行上下文
// 3.评估（Evaluate）：递归调用模块评估，并执行
// 4.执行（ExecuteModule）：初始化执行上下文并推入栈中执行

//【顶层模块执行】任务
function TopLevelModuleEvaluationJob(sourceText, hostDefined){
    //断言：sourceText是一段ecmascript源文本

    //通过领域解析模块
    let realm = this.ExecutionContext.Realm.RealmRecord
    let m = ParseModule(sourceText, realm, hostDefined)
    if(!m) throw error

    //实例化模块
    m.Instantiate()

    //断言：所有m的的依赖都已经被完全转换且m可以被执行

    //评估模块
    return m.Evaluate()
}

//模块【解析】
function ParseModule(sourceText, realm, hostDefined){
    //返回一条模块源文本记录
    return new SourceTextModuleRecord({
        "[[Realm]]":realm,
        "[[Environment]]":undefined,
        "[[Namespace]]":undefined,
        "[[Status]]":"uninstantiated",
        "[[EvaluationError]]":undefined,
        "[[HostDefined]]":hostDefined,
        "[[ECMAScriptCode]]":body,
        "[[RequestedModules]]":requestedModules,                //模块的require列表
        "[[ImportEntries]]":importEntries,                      //模块的import列表
        "[[LocalExportEntries]]":localExportEntries,            //模块导出的变量名列表
        "[[IndirectExportEntries]]":indirectExportEntries,      //重复加载的模块变量列表
        "[[StarExportEntries]]":starExportEntries,              //使用*全部加载的模块变量列表
        "[[DFSIndex]]":undefined,
        "[[DFSAncestorIndex]]":undefined
    })
}

//模块【实例化】
ModuleRecord.Instantiate = function(){
    let module = this

    //断言：模块状态不为【实例化】中或【执行中】

    //递归为模块依赖树执行【实例化】
    let stack = []
    let result = InnerModuleInstantiation(module, stack, 0)

    //如果实例化中断，则将每个模块置为【已实例化】以中止递归
    if(!result){
        stack.forEach(m=>{
            //断言：m模块状态为【实例化中】
            m["[[Status]]"] = "uninstantiated"
            m["[[Environment]]"] = undefined
            m["[[DFSIndex]]"] = undefined
            m["[[DFSAncestorIndex]]"] = undefined
        })
        //断言：模块状态为【已实例化】
        return result
    }

    //断言：模块状态为【已实例化】或【已执行】
    //断言：stack为空
    return undefined
}

//模块【评估】
ModuleRecord.Evaluate = function(){
    let module = this

    //断言：模块状态不为【评估中】或【执行中】

    //递归为模块依赖树执行【评估】
    let stack = []
    let result = InnerModuleEvaluation(module, stack, 0)

    //如果评估中断，则将每个模块置为【已评估】以中止递归
    if(!result){
        stack.forEach(m=>{
            //断言：m模块状态为【评估中】
            m["[[Status]]"] = "uninstantiated"
            m["[[Environment]]"] = undefined
            m["[[DFSIndex]]"] = undefined
            m["[[DFSAncestorIndex]]"] = undefined
        })
        //断言：模块状态为【已评估】
        return result
    }

    //断言：模块状态为【已评估】或【已执行】
    //断言：stack为空
    return undefined
}

//模块【执行】
ModuleRecord.ExecuteModule = function(){
    //初始化一个新的执行上下文
    let module = this
    let moduleCxt = new ExecutionContext()
    moduleCxt.Function = null

    //断言：module.[[Realm]]不为undefined
    moduleCxt.Realm = module["[[Realm]]"]
    moduleCxt.ScriptOrModule = module
    
    //断言：模块已被链接且模块环境中的声明已被实例化
    moduleCxt.VariableEnvironment = module["[[Environment]]"]
    moduleCxt.LexicalEnvironment = module["[[Environment]]"]

    //【挂起】当前的执行上下文
    Suspend()

    //将新的执行上下文推入执行上下文堆栈并执行
    ExecutionContextStack.push(moduleCxt)

    //评估模块代码
    let result = Evaluate(module["[[ECMAScriptCode]]"])

    //【中断】当前执行上下文并移出堆栈
    Suspend()
    ExecutionContextStack.pop()

    //【恢复】挂起的执行上下文
    Resume()

    return result
}

//递归为【内部模块依赖树】执行实例化
function InnerModuleInstantiation(module, stack, index){
    //如果模块为【循环引用】模块，则先初始化每个模块的status
    //修改模块状态
    //记录模块深度index
    //为每个引入的模块创建实例并【实例化内部模块】
    //初始化【上下文环境】
    module.InitializeEnvironment()
    //返回当前index
    return index
}

//递归为【内部模块依赖树】执行评估
function InnerModuleEvaluation(module, stack, index){
    //如果模块为【循环引用】模块，则先初始化每个模块的status
    //修改模块状态
    //记录模块深度index
    //为每个引入的模块创建实例并【实例化内部模块】
    //模块执行
    module.ExecuteModule()
    //返回当前index
    return index
}