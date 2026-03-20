const CareerTwinApplication = require('../application-model');
const CareerTwinApplicationEvent = require('../application-event-model');

class TrackingAgent {
    async createEvent({ userId, applicationId, type, fromStatus = '', toStatus = '', message = '', payload = {}, createdBy = 'agent' }) {
        return CareerTwinApplicationEvent.create({
            userId,
            applicationId,
            type,
            fromStatus,
            toStatus,
            message,
            payload,
            createdBy,
        });
    }

    async updateStatus({ userId, applicationId, toStatus, note = '', createdBy = 'user' }) {
        const application = await CareerTwinApplication.findOne({ _id: applicationId, userId });
        if (!application) {
            throw new Error('Application not found');
        }

        const fromStatus = application.status;
        application.status = toStatus;
        application.timeline.lastUpdatedAt = new Date();
        if (toStatus === 'applied' && !application.timeline.appliedAt) {
            application.timeline.appliedAt = new Date();
        }
        if (note) {
            application.notes = [application.notes, note].filter(Boolean).join('\n');
        }
        await application.save();

        await this.createEvent({
            userId,
            applicationId: application._id,
            type: 'status_updated',
            fromStatus,
            toStatus,
            message: note || `Status changed from ${fromStatus} to ${toStatus}`,
            createdBy,
        });

        return application;
    }

    async getKanban(userId) {
        const apps = await CareerTwinApplication.find({ userId }).populate('jobId').sort({ updatedAt: -1 }).lean();
        const columns = {
            draft: [],
            applied: [],
            shortlisted: [],
            interview: [],
            rejected: [],
            offer: [],
        };

        apps.forEach((app) => {
            if (!columns[app.status]) return;
            columns[app.status].push(app);
        });

        return columns;
    }
}

module.exports = new TrackingAgent();
