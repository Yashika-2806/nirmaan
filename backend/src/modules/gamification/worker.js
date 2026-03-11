class GamificationWorker {
    constructor(processor) {
        this.processor = processor;
        this.queue = [];
        this.isProcessing = false;
    }

    enqueue(job) {
        const jobWithId = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ...job,
        };

        this.queue.push(jobWithId);
        this.drain();

        return {
            jobId: jobWithId.id,
            queueSize: this.queue.length,
        };
    }

    async drain() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const job = this.queue.shift();
            try {
                await this.processor(job);
            } catch (error) {
                console.error('[GamificationWorker] Job failed:', error.message);
            }
        }

        this.isProcessing = false;
    }
}

module.exports = GamificationWorker;
