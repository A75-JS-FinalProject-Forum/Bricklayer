export function buildCommentTree(comments) {
    const map = {};
    const roots = [];
    comments.forEach(comment => {
        map[comment.id] = { ...comment, children: [] };
    });
    comments.forEach(comment => {
        if (comment.parent_id) {
            map[comment.parent_id]?.children.push(map[comment.id]);
        } else {
            roots.push(map[comment.id]);
        }
    });
    return roots;
}
