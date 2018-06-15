export default (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    title: {
      type: DataTypes.STRING
    },
    date: {
      type: DataTypes.DATE
    },
    description: {
      type: DataTypes.STRING
    },
    image: {
      type: DataTypes.STRING
    }
  });

  Book.associate = models => {
    Book.belongsTo(models.Author, {
      foreignKey: {
        name: 'author_id',
        field: 'author_id'
      }
    });
  };

  return Book;
};
