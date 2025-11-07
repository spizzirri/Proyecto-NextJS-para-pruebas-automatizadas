class MongoDBException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MongoDBException';
  }
}

export default MongoDBException;

