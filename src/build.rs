//! 该模块需在 rust 其它源文件编译之前进行编译, 将静态文件加入定义的 StaticFile 结构中, 然后将模板编译成可执行函数.
//! 编译后的全部文件将通过 `include!` 宏命令的方式引入到 `main.rs` 中供使用.

use ructe::{Ructe, RucteError};

fn main() -> Result<(), RucteError> {
    let mut ructe = Ructe::from_env()?;         //创建一个 Ructe 实例. 同时, 创建文件: templates.rs 以及一个包含子模块的目录: templates, 当 main() 执行完毕, 文件内容才全部建立
    let mut statics = ructe.statics()?;
    statics.add_files("static")?;               // static 是项目根目录的文件夹名称, 将文件夹内的所有静态文件, 图片, js等加入到 StaticFile 实例中
    // statics.add_sass_file("scss/style.scss")?;  // 使用 rsass crate 将 scss 文件编译成 css 文件并压缩, 然后加入到 StaticFile 实例中. 
    ructe.compile_templates("templates")        // 将 templates (位于项目根目录, 即与 toml 文件同目录) 目录下的所有模板文件编译成函数, 存放在 cargo 指定的 outdir 内的 templates 目录中
}