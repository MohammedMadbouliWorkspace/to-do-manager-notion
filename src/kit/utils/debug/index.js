const ced = async (callback, name) => {
    const start = new Date()
    const output = await callback()
    const end = new Date()
    const execDuration = end - start
    console.log(`::: Execution duration for ${name}: ${execDuration} ms :::`)
    return [output, execDuration]
}

exports.ced = ced