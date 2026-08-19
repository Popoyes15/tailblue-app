use keyring::{Entry, Error};

const SERVICE: &str = "com.tailblue.desktop";
const ACCOUNT: &str = "discord-session";

fn entry() -> Result<Entry, String> {
    Entry::new(
        SERVICE,
        ACCOUNT,
    )
    .map_err(|error| {
        format!(
            "Impossible d'accéder au coffre sécurisé : {error}"
        )
    })
}

#[tauri::command]
pub fn tailblue_auth_token_load(
) -> Result<Option<String>, String> {

    let entry = entry()?;

    match entry.get_password() {
        Ok(token) => {
            let clean = token.trim();

            if clean.is_empty() {
                Ok(None)
            } else {
                Ok(Some(clean.to_string()))
            }
        }

        Err(Error::NoEntry) => Ok(None),

        Err(error) => Err(format!(
            "Impossible de restaurer la session TailBlue : {error}"
        )),
    }
}

#[tauri::command]
pub fn tailblue_auth_token_save(
    token: String,
) -> Result<(), String> {

    let clean = token.trim();

    if clean.is_empty() {
        return Err(
            "Impossible d'enregistrer une session vide."
                .to_string()
        );
    }

    entry()?
        .set_password(clean)
        .map_err(|error| {
            format!(
                "Impossible d'enregistrer la session TailBlue : {error}"
            )
        })
}

#[tauri::command]
pub fn tailblue_auth_token_clear(
) -> Result<(), String> {

    let entry = entry()?;

    match entry.delete_credential() {
        Ok(()) => Ok(()),

        Err(Error::NoEntry) => Ok(()),

        Err(error) => Err(format!(
            "Impossible de supprimer la session TailBlue : {error}"
        )),
    }
}
