// 【词法环境】是ecma262规范规定的规范类型
// 他包括一个【环境记录】和一个对【外部环境记录的引用】
// 他们互相嵌套并记录了在其关联的词法环境范围内创建的标识符绑定

// 【词法环境】共有三种：
// 1.【全局词法环境】: 当领域被声明时创建的词法环境；
// 2.【方法词法环境】: 当一个方法被声明时创建的词法环境；
// 3.【模块词法环境】: 当一个模块被声明时创建的词法环境；

// 【词法环境记录】共有五种：
// 1.【声明环境记录】: 当一个声明被声明时创建的环境记录，如let，const，function
// 2.【对象环境记录】: 当一个标识符绑定与对象进行关联时创建的环境记录，如with(a){ key=value }；
// 3.【全局环境记录】: 是声明环境记录的一种，最外部的词法环境记录，他的外部引用为空；
// 4.【方法环境记录】: 是声明环境记录的一种，当一个方法被声明时创建的环境记录，如function(){}；
// 5.【模块环境记录】: 是声明环境记录的一种，当一个模块被声明时创建的环境记录，如module.exports = {}；

// 以下的所有方法均为ecma-262规范的抽象方法，并非具体实现

// 获取标识符引用
// let a = 1
// function b(){
//     console.log(a)
// }
// 当b方法中需要获取a时，执行GetIdentifierReference(functionBLex, a, true)
// b的环境记录中没有a的绑定，则向外部环境获取a的绑定，得到a的引用，打印1
function GetIdentifierReference(lex, name, strict) {
    //如果没有传入词法环境，返回一个undefined引用
    if (lex === null) return new Reference({
        value: undefined,
        name: name,
        strict: strict
    })

    //如果此环境的记录中存在name的绑定，则返回当前环境记录的引用
    let envRec = lex.EnvironmentRecord
    let exists = envRec.HasBinding(name)
    if (exists === true) return new Reference({
        value: envRec,
        name: name,
        strict: strict
    })
    //否则在当前环境的外部环境记录中查询标识符绑定
    else {
        let outer = lex.outerEnvironmentRecord
        return GetIdentifierReference(outer, name, strict)
    }
}

//创建一个全局词法环境
function NewGlobalEnvironment(G, thisValue) {
    let env = new LexicalEnvironment()
    let objRec = new ObjectEnvironmentRecord(G)
    let dclRec = new DeclarativeEnvironmentRecord()
    let globalRec = new GlobalEnvironmentRecord()

    //初始化全局环境记录
    globalRec["[[ObjectRecord]]"] = objRec
    globalRec["[[GlobalThisValue]]"] = thisValue
    globalRec["[[DeclarativeRecord]]"] = dclRec
    globalRec["[[VarNames]]"] = []

    //设置全局词法环境的环境记录，外部记录为null
    env.EnvironmentRecord = globalRec
    env.outerEnvironmentRecord = null
    return env
}

//创建一个模块词法环境
function NewGlobalEnvironment(E) {
    let env = new LexicalEnvironment()
    let envRec = new ModuleEnvironmentRecord()
    env.EnvironmentRecord = envRec
    env.outerEnvironmentRecord = E
}

//创建一个方法词法环境
function NewGlobalEnvironment(F, newTarget) {
    // 断言：F是一个方法
    // 断言：newTarget是一个对象或undefined
    let env = new LexicalEnvironment()
    let envRec = new FunctionEnvironmentRecord()

    //导致环境记录被创建的方法
    envRec["[[FunctionObject]]"] = F

    //该方法遵守词法环境调用规则
    if (F["[[ThisMode]]"] === "lexical") envRec["[[ThisBindingStatus]]"] = "lexical"
    else envRec["[[ThisBindingStatus]]"] = "uninitialized"

    //环境记录的父对象和this指向
    let home = F["[[HomeObject]]"]
    envRec["[[HomeObject]]"] = home
    envRec["[[NewTarget]]"] = newTarget
    env.EnvironmentRecord = envRec
    env.outerEnvironmentRecord = F["[[Environment]]"]
    return env
}

//创建一个对象词法环境
function NewGlobalEnvironment(O, E) {
    let env = new LexicalEnvironment()
    let envRec = new ObjectEnvironmentRecord(O)
    env.EnvironmentRecord = envRec
    env.outerEnvironmentRecord = E
}

//创建一个声明词法环境
function NewGlobalEnvironment(E) {
    let env = new LexicalEnvironment()
    let envRec = new DeclarativeEnvironmentRecord()
    env.EnvironmentRecord = envRec
    env.outerEnvironmentRecord = E
}