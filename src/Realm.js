// 【领域】是ecma262规范规定的规范类型
// 用于定义js的内部对象和在不同宿主环境下的行为
// 如浏览器环境，node.js环境等（V8引擎是一种js的具体实现，不属于宿主环境）
// @property [[Intrinsics]]:    领域的内置属性
// @property [[GlobalObject]]:  领域的全局对象
// @property [[GlobalEnv]]:     领域的全局环境
// @property [[TemplateMap]]:   一个模板记录的列表，定义了代码节点和相应的对象
// @property [[HostDefined]]:   领域的宿主额外定义

// 以下的所有函数均为ecma-262规范的抽象函数，并非具体实现

//初始化宿主定义的领域：
function InitializeHostDefinedRealm() {
    //创建全局领域
    let realm = CreateRealm()

    //创建全局执行上下文
    let globalContext = new ExecutionContext()
    globalContext.Function = null
    globalContext.Realm = realm
    globalContext.ScriptOrModule = null

    //将全局上下文推入栈中
    executionContextStack.push(globalContext)

    //如果主机定义了一个特殊的全局变量,否则为undefined
    let global = exoticObject ? exoticObject : undefined

    //如果主机定义了一个特殊的this指向，否则为undefined
    let thisValue = thisValue ? thisValue : undefined

    //为领域注入全局对象和this指向
    SetRealmGlobalObject(realm, global, thisValue)

    //为领域注入默认全局对象并返回他的引用
    let globalObj = SetDefaultGlobalBindings(realm)

    //在globalObj上实现任何自定义的全局对象
    globalObj.extra = "芜湖"

    return true
}

//创建领域对象
function CreateRealm() {
    //创建一个领域对象
    let realmRec = new RealmRecord()

    //初始化领域对象的内置对象
    CreateIntrinsics(realmRec)

    //初始化领域对象的全局对象，全局环境和模板节点对象
    realmRec["[[GlobalObject]]"] = undefined
    realmRec["[[GlobalEnv]]"] = undefined
    realmRec["[[TemplateMap]]"] = []
    return realmRec
}

//为领域注入内部属性
function CreateIntrinsics(realmRec) {
    //初始化领域的内置对象
    let intrinsics = new Record()
    realmRec["[[Intrinsics]]"] = intrinsics

    //初始化领域的原型对象
    let objProto = Object.create(null)
    intrinsics["[[%ObjectPrototype%]]"] = objProto

    //为领域注入内部函数，包括http://www.ecma-international.org/ecma-262/10.0/index.html#table-7
    const IntrinsicsList = ["%Array%", "%ArrayBuffer%", ...intrinsics]
    IntrinsicsList.map(fun => {
        //如：注入类型错误抛出函数
        let steps = fun
        let thrower = CreateBuiltinFunction(steps, [], realmRec, null)
        intrinsics["[[%ThrowTypeError%]]"] = thrower
    })
}

//为领域注入全局对象和this指向
function SetRealmGlobalObject(realmRec, globalObj, thisValue) {
    //如果没有传入globalObj，则globalObj继承自领域的原型对象
    if (globalObj === undefined) {
        let intrinsics = realmRec["[[Intrinsics]]"]
        globalObj = ObjectCreate(intrinsics["[[%ObjectPrototype%]]"])
    }

    //如果没有传入thisValue，则thisValue指向全局对象
    if (thisValue === undefined) thisValue = globalObj

    //通过globalObj和thisValue创建全局环境记录
    let newGlobalEnv = NewGlobalEnvironment(globalObj, thisValue)

    //将全局对象和this指向注入领域
    realmRec["[[GlobalObject]]"] = globalObj
    realmRec["[[GlobalEnv]]"] = newGlobalEnv
}

//为领域注入默认全局对象并返回他的引用
function SetDefaultGlobalBindings(realmRec) {
    //获取领域全局对象
    let global = realmRec["[[GlobalObject]]"]

    //遍历领域全局对象的属性
    for (let property in global) {
        //属性名
        let name = property
        //生成一个完整的数据属性描述
        let desc = {
            "[[Value]]": realmRec["[[Intrinsics]]"][name],
            "[[Writable]]": false,
            "[[Enumerable]]": false,
            "[[Configurable]]": false
        }
        //为global对象添加领域内置对象的完整数据属性描述
        DefinePropertyOrThrow(global, name, desc)
    }
    return global
}

module.exports = InitializeHostDefinedRealm