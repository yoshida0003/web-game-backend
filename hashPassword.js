import bcrypt from "bcryptjs";

const password = "yossy0508"; // 管理者のパスワードを入力
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function (err, hash) {
  if (err) {
    console.error("Error hashing password:", err);
  } else {
    console.log("Hashed password:", hash);
  }
});
