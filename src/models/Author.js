// import bcrypt from 'bcrypt';

export default (sequelize, DataTypes) => {
  const Author = sequelize.define('Author', {
    first_name: {
      type: DataTypes.STRING
    },
    last_name: {
      type: DataTypes.STRING
    },
    birthdate: {
      type: DataTypes.STRING
    }
  });

  return Author;
};
