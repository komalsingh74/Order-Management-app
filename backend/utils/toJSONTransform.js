// Shared Mongoose toJSON transform: _id -> id, drop __v.
const toJSONTransform = (_doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};

export default toJSONTransform;
