//ECMASCRIPT RUNTIME MODEL(ABSTRACT)
//ecmascript抽象运行时模型

import RunJobs from "./Job.js"
import ScriptEvaluationJob from "./Script.js"

//创建一块共享内存区域
let shareMemort = new SharedArrayBuffer(1024)

//创建一个代理集群
let AgentCluster = new AgentCluster(shareMemort)

//初始化一个jscore执行线程
let ExecutionThread = new ExecutionThread("JSCORE")

//初始化一个执行上下文堆栈
let ExecutionContextStack = new ExecutionContextStack()

//初始化一个任务队列的集合
let ScriptJobQueue = new JobQueue()
let MacroJobQueue = new JobQueue()
let MicroJobQueue = new JobQueue()
let JobQueueSets = {
    "ScriptJobQueue": ScriptJobQueue,
    "MacroJobQueue": MacroJobQueue,
    "MicroJobQueue": MicroJobQueue
}

//创建一个代理记录
let AgentRecord = new AgentRecord({
    "[[LittleEndian]]": true,
    "[[CanBlock]]": false,
    "[[Signifier]]": "agent1"
})

//创建一个代理
let Agent = new Agent(ExecutionContextStack, JobQueueSets, AgentRecord, ExecutionThread)

//将代理推入代理集群中
AgentCluster.push(Agent)

//将脚本评估任务推入脚本任务队列
ScriptJobQueue.push(ScriptEvaluationJob)

//遍历代理并执行任务循环
AgentCluster.forEach(Agent=>{
    RunJobs(Agent.ExecutionContextStack, Agent.ExecutionThread)
})