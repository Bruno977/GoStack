import { Sequelize } from "sequelize";
import { Model } from "sequelize";

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password_hash: Sequelize.String,
        provider: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );
  }
}
export default User;
