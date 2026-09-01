mod auth_keychain;

use std::time::Duration;

use tauri::{Emitter, Manager};

use tauri_plugin_updater::UpdaterExt;


#[tauri::command]
fn greet(name: &str) -> String {
    format!(
        "Hello, {}! You've been greeted from Rust!",
        name
    )
}


fn open_main(app: &tauri::AppHandle) {
    if let Some(updater_window) =
        app.get_webview_window("updater")
    {
        let _ = updater_window.close();
    }

    if let Some(main_window) =
        app.get_webview_window("main")
    {
        let _ = main_window.show();
        let _ = main_window.unminimize();
        let _ = main_window.set_focus();
    }
}


async fn startup_updater(app: tauri::AppHandle) {
    /*
     * Petit délai volontaire :
     * laisse updater.html charger ses listeners.
     *
     * MAIS Rust reste totalement indépendant
     * du frontend.
     */
    tokio::time::sleep(
        Duration::from_millis(1000)
        )
    .await;

    let _ = app.emit_to(
        "updater",
        "tailblue-updater-status",
        "checking",
    );


    let updater = match app.updater() {
        Ok(value) => value,

        Err(error) => {
            eprintln!(
                "Updater indisponible : {error}"
            );

            let _ = app.emit_to(
                "updater",
                "tailblue-updater-status",
                "error",
            );

            tokio::time::sleep(
                Duration::from_millis(1500)
            )
            .await;

            open_main(&app);

            return;
        }
    };


    match updater.check().await {
        Ok(Some(update)) => {
            let version =
                update.version.clone();


            let _ = app.emit_to(
                "updater",
                "tailblue-updater-status",
                format!(
                    "update:{version}"
                ),
            );


            let progress_app =
                app.clone();

            let finished_app =
                app.clone();

            let mut downloaded: u64 = 0;


            let result =
                update
                    .download_and_install(
                        move |
                            chunk_length,
                            content_length
                        | {
                            downloaded +=
                                chunk_length
                                    as u64;


                            if let Some(total) =
                                content_length
                            {
                                if total > 0 {
                                    let percentage =
                                        (
                                            downloaded
                                                as f64
                                            / total
                                                as f64
                                            * 100.0
                                        )
                                        .round()
                                            as u64;


                                    let percentage =
                                        percentage
                                            .min(100);


                                    let _ =
                                        progress_app
                                            .emit_to(
                                                "updater",
                                                "tailblue-updater-progress",
                                                percentage,
                                            );
                                }
                            }
                        },

                        move || {
                            let _ =
                                finished_app
                                    .emit_to(
                                        "updater",
                                        "tailblue-updater-status",
                                        "installing",
                                    );
                        },
                    )
                    .await;


            match result {
                Ok(_) => {
                    let _ = app.emit_to(
                        "updater",
                        "tailblue-updater-status",
                        "restart",
                    );


                    tokio::time::sleep(
                        Duration::from_millis(900)
                    )
                    .await;


                    app.restart();
                }


                Err(error) => {
                    eprintln!(
                        "Erreur installation update : {error}"
                    );


                    let _ = app.emit_to(
                        "updater",
                        "tailblue-updater-status",
                        "error",
                    );


                    tokio::time::sleep(
                        Duration::from_millis(1500)
                    )
                    .await;


                    open_main(&app);
                }
            }
        }


        Ok(None) => {
            let _ = app.emit_to(
                "updater",
                "tailblue-updater-status",
                "up-to-date",
            );


            tokio::time::sleep(
                Duration::from_millis(2500)
            )
            .await;


            open_main(&app);
        }


        Err(error) => {
            eprintln!(
                "Vérification update impossible : {error}"
            );


            let _ = app.emit_to(
                "updater",
                "tailblue-updater-status",
                "error",
            );


            tokio::time::sleep(
                Duration::from_millis(1500)
            )
            .await;


            open_main(&app);
        }
    }
}


#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {
    tauri::Builder::default()

        .plugin(
            tauri_plugin_single_instance::init(
                |app, args, _cwd| {
                    println!(
                        "🔗 TailBlue a reçu : {:?}",
                        args
                    );


                    if let Some(window) =
                        app.get_webview_window(
                            "main"
                        )
                    {
                        let _ =
                            window.show();

                        let _ =
                            window.unminimize();

                        let _ =
                            window.set_focus();
                    }
                },
            ),
        )

        .plugin(
            tauri_plugin_deep_link::init()
        )

        .plugin(
            tauri_plugin_notification::init()
        )

        .plugin(
            tauri_plugin_opener::init()
        )

        .setup(|app| {
            /*
             * Plugin updater.
             */
            #[cfg(desktop)]
            app.handle().plugin(
                tauri_plugin_updater::Builder::new()
                    .build(),
            )?;


            /*
             * Deep links.
             */
            #[cfg(any(
                target_os = "linux",
                all(
                    debug_assertions,
                    windows
                )
            ))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;

                app.deep_link()
                    .register_all()?;
            }


            /*
             * IMPORTANT :
             *
             * Rust démarre l'updater lui-même.
             * Aucun invoke JS nécessaire.
             */
            let handle =
                app.handle().clone();


            tauri::async_runtime::spawn(
                async move {
                    startup_updater(
                        handle
                    )
                    .await;
                },
            );


            Ok(())
        })

        .invoke_handler(
            tauri::generate_handler![
                greet,
                auth_keychain::tailblue_auth_token_load,
                auth_keychain::tailblue_auth_token_save,
                auth_keychain::tailblue_auth_token_clear
            ],
        )

        .run(
            tauri::generate_context!()
        )

        .expect(
            "error while running tauri application"
        );
}