export class TaskQueue {
    private queue: Function[] = []
    private running: boolean = false

    constructor(public interval: number = 1000) {}

    public add(task: Function) {
        this.queue.push(task)
        if (!this.running) {
            this.runTasks()
        }
    }

    private runTasks() {
        if (this.queue.length > 0) {
            const task = this.queue.shift()
            if (task) {
                this.running = true
                task()
                setTimeout(() => {
                    this.runTasks()
                }, this.interval)
            }
        } else {
            this.running = false
        }
    }
}
