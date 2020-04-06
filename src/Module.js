// ECMA262【模块】执行

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

    //执行模块
    return m.Evaluate()
}

//解析模块
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

//模块实例化
ModuleRecord.Instantiate = function(){
    let module = this

    //断言：模块状态不为实例化中或执行中

    //递归为模块依赖树执行实例化
    let stack = []
    let result = InnerModuleInstantiation(module, stack, 0)

    //如果实例化中断，则将每个模块定义为为实例化
    if(!result){
        stack.forEach(m=>{
            //断言：m模块状态为实例化中
            m["[[Status]]"] = "uninstantiated"
            m["[[Environment]]"] = undefined
            m["[[DFSIndex]]"] = undefined
            m["[[DFSAncestorIndex]]"] = undefined
        })
        //断言：模块状态为未实例化
        return result
    }

    //断言：模块状态为未已实例化或已执行
    //断言：stack为空
    return undefined
}

//模块执行
ModuleRecord.Evaluate = function(){

}

//递归为模块依赖树执行实例化
function InnerModuleInstantiation(){

}