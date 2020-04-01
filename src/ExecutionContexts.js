// 【执行上下文】是ecma262规范规定的js运行时对象
// 【执行上下文】记录了js代码在执行时的上下文环境
// 所有的执行上下文通过一个【执行上下文堆栈】进入执行
// 同一时间有且只有一个在栈顶的【执行上下文】或代理可以被执行
// 当执行过程中出现了一段没有和当前上下文关联的代码，就创建一个新的执行上下文并推入栈顶
// @state codeEvaluationState    表示当前执行上下文的状态：【执行】，【挂起】或者【恢复】
// @state Function               表示当前执行上下文正在执行的【方法对象】，如果当前执行的不是Function，则为null
// @state Realm                  表示当前执行上下文所属的【领域】
// @state Script/Module          表示当前执行上下文正在执行的【Script记录】或【Module记录】，如果当前执行的不是Script或Module，则为null
// @state LexicalEnvironment     表示当前执行上下文的【词法环境】
// @state VariableEnvironment    表示当前执行上下文的【词法环境】中通过var声明的绑定
// @state Generator              表示new一个对象时创建的执行上下文所对应的生成器对象

// 获取当前正在执行的Script或Module
function GetActiveScriptOrModule(){}

//获取name绑定
function ResolveBinding(name,env){}

//当调用this.时获取this指向的环境记录
function GetThisEnvironment(){}

//获取当前this的绑定
function ResolveThisBinding(){}

//获取当前语法环境的newTarget属性（是否通过call等方法改变了this指向）
function GetNewTarget(){}

//获取当前领域的全局对象
function GetGlobalObject(){}