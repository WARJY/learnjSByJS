// 【任务】是用来执行延迟任务或异步任务的对象
// 【任务】并非ecma262规定的规范类型，【可以被以任何形式实现】
// 当异步任务被创建时，任务被创建并推入【任务队列】中
// 在当前的【执行上下文堆栈】为空且没有正在执行的【执行上下文】时任务才可以被执行
// 【任务】会一直执行直到【任务队列】被清空为止
import InitializeHostDefinedRealm from "./Realm.js"

//初始化任务循环
function RunJobs() {
    //初始化主机定义的领域
    InitializeHostDefinedRealm()

    //以任何方式获取脚本的原文本及宿主环境的附加对象
    let params = {
        ...sourceText,
        ...hostDefined
    }

    //如果源代码为ECMAScript Script源代码
    if (sourceText === SourceCodeType.GlobalCode) {
        EnqueueJob("ScriptJobs", ScriptEvaluationJob, params)
    }

    //如果源代码为模块源代码
    if (sourceText === SourceCodeType.GlobalCode) {
        EnqueueJob("ScriptJobs", TopLevelModuleEvaluationJob, params)
    }

    //循环
    while (true) {
        //终止当前正在执行的执行上下文并将其移出执行上下文栈
        Suspend(executionContextStack, runningExecutionContext)

        //获取以任何方式实现的任务队列
        let nextQueue = JobQueue

        //从任务队列中取出任务
        let nextPending = nextQueue.pop()

        //通过任务初始化一个执行上下文
        let newContext = new ExecutionContext()
        newContext.Function = null
        newContext.Realm = nextPending["[[Realm]]"]
        newContext.ScriptOrModule = nextPending["[[ScriptOrModule]]"]

        //将执行上下文推入执行上下文栈中
        executionContextList.push(newContext)

        //执行任务
        let result = nextPending["[[Job]]"](nextPending["[[Arguments]]"])

        //如果出现异常则抛出错误
        if (!result) HostReportErrors(result["[[Value]]"])
    }
}

//创建任务并推入队列
function EnqueueJob(queueName, job, arguments) {
    //断言：queueName是一个被实现的队列名
    //断言：job是一个任务名
    //断言：arguments是job所需要的参数列表
    
    let callerContext = runningExecutionContext
    let callerRealm = callerContext["[[Realm]]"]
    let callerScriptOrModule = callerContext["[[ScriptOrModule]]"]

    //创建一个等待中的任务，并保存当前的领域，参数和任务内容
    let pending = new PendingJob({
        "[[Job]]":job,
        "[[Arguments]]":arguments,
        "[[Realm]]":callerRealm,
        "[[ScriptOrModule]]":callerScriptOrModule,
        "[[HostDefined]]":undefined,
    })

    //为任务注入宿主的额外定义
    pending["[[HostDefined]]"].extra = "extraText"

    //将任务推入queueName队列中
    queue[queueName].push(pending)

    return true
}

module.exports = RunJobs