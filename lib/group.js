const Baileys = require("baileys");

class Group {
    constructor(ctx) {
        this.ctx = ctx;
    }

    async create(subject, members) {
        return await this.ctx._client.groupCreate(subject, members);
    }
    async inviteCodeInfo(code) {
        return await this.ctx._client.groupGetInviteInfo(code);
    }
    async acceptInvite(code) {
        return await this.ctx._client.groupAcceptInvite(code);
    }
    async acceptInviteV4(key, inviteMessage) {
        return await this.ctx._client.groupAcceptInviteV4(key, inviteMessage);
    }
}

class GroupData {
    constructor(ctx, jid, useCache) {
        this.ctx = ctx;
        this.jid = jid;
        this.useCache = useCache;
        this.groupCache = ctx._self.groupCache;
    }

    async metadata() {
        const fetchMetadata = async () => this.ctx._client.groupMetadata(this.jid).catch(() => ({}));
        return this.useCache ? (this.groupCache.get(this.jid) || await fetchMetadata()) : await fetchMetadata();
    }

    async getMetadata(key) {
        return (await this.metadata())?.[key] || null;
    }

    async name() {
        return await this.getMetadata("subject");
    }
    async description() {
        return await this.getMetadata("desc");
    }
    async owner() {
        return await this.getMetadata("owner");
    }
    async members() {
        return await this.getMetadata("participants");
    }

    async updateSubject(subject) {
        return await this.ctx._client.groupUpdateSubject(this.jid, subject);
    }
    async updateDescription(description) {
        return await this.ctx._client.groupUpdateDescription(this.jid, description);
    }
    async updateProfilePicture(buffer, dimensions) {
        return await this.ctx._client.updateProfilePicture(this.jid, buffer, dimensions);
    }

    async updateSetting(setting) {
        await this.ctx._client.groupSettingUpdate(this.jid, setting);
    }
    async open() {
        await this.updateSetting("not_announcement");
    }
    async close() {
        await this.updateSetting("announcement");
    }
    async lock() {
        await this.updateSetting("locked");
    }
    async unlock() {
        await this.updateSetting("unlocked");
    }

    async membersUpdate(members, action) {
        return await this.ctx._client.groupParticipantsUpdate(this.jid, Array.isArray(members) ? members : [members], action);
    }

    async kick(members) {
        return await this.membersUpdate(members, "remove");
    }
    async add(members) {
        return await this.membersUpdate(members, "add");
    }
    async promote(members) {
        return await this.membersUpdate(members, "promote");
    }
    async demote(members) {
        return await this.membersUpdate(members, "demote");
    }

    async leave() {
        await this.ctx._client.groupLeave(this.jid);
    }
    async inviteCode() {
        return await this.ctx._client.groupInviteCode(this.jid);
    }
    async revokeInviteCode() {
        return await this.ctx._client.groupRevokeInvite(this.jid);
    }

    async pendingMembers() {
        return await this.ctx._client.groupRequestParticipantsList(this.jid);
    }
    async pendingMembersUpdate(members, action) {
        return await this.ctx._client.groupRequestParticipantsUpdate(this.jid, Array.isArray(members) ? members : [members], action);
    }
    async approvePendingMembers(members) {
        return await this.pendingMembersUpdate(members, "approve");
    }
    async rejectPendingMembers(members) {
        return await this.pendingMembersUpdate(members, "reject");
    }

    async toggleEphemeral(expiration) {
        return await this.ctx._client.groupToggleEphemeral(this.jid, expiration);
    }
    async membersCanAddMemberMode(mode) {
        return await this.ctx._client.groupMemberAddMode(this.jid, mode === "on" ? "all_member_add" : "admin_add");
    }
    async joinApproval(mode) {
        return await this.ctx._client.groupJoinApprovalMode(this.jid, mode);
    }

    async _isMemberCheck(jid, checkFn) {
        const members = await this.members();
        if (!members) return false;
        const field = Baileys.isLidUser(jid) ? "lid" : "phoneNumber";
        return members.some(member => Baileys.areJidsSameUser(member[field], jid) && checkFn(member));
    }

    async isMemberExist(jid) {
        return await this._isMemberCheck(jid, () => true);
    }
    async isAdmin(jid) {
        return await this._isMemberCheck(jid, (member) => !!member.admin);
    }
    async isOwner(jid) {
        return await this._isMemberCheck(jid, (member) => member.admin === "superadmin");
    }
    async isSenderAdmin() {
        return await this.isAdmin(this.ctx._sender.jid);
    }
    async isSenderOwner() {
        return await this.isOwner(this.ctx._sender.jid);
    }
    async isBotAdmin() {
        return await this.isAdmin(this.ctx.me?.id);
    }
}

module.exports = {
    Group,
    GroupData
};