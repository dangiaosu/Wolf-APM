import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import './App.css';

function App() {
  const [profiles, setProfiles] = useState([]);
  const [profileData, setProfileData] = useState({
    profile_name: '',
    gmail: '',
    gmail_password: '',
    gmail_2fa: '',
    twitter: '',
    twitter_password: '',
    twitter_2fa: '',
    discord: '',
    discord_password: '',
    discord_2fa: '',
    telegram: '',
    phone_number: '',
    sim_card: '',
    galxe: '',
    evm_address: '',
    ton_address: '',
    evm_key: '',
    ton_key: ''
  });

  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editingProfileData, setEditingProfileData] = useState({});
  const [twoFACodes, setTwoFACodes] = useState({});
  const [remainingTimes, setRemainingTimes] = useState({});
  const [showEVMKey, setShowEVMKey] = useState({});
  const [showTONKey, setShowTONKey] = useState({});
  const [disabled2FA, setDisabled2FA] = useState({});

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = () => {
    axios.get('http://localhost:5000/api/profiles')
      .then(res => {
        const updatedProfiles = res.data.data.map((profile, index) => ({
          ...profile,
          index: index + 1
        }));
        setProfiles(updatedProfiles);
      })
      .catch(err => console.log(err));
  };

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddOrUpdateProfile = (e) => {
    e.preventDefault();
    if (editingProfileId) {
      axios.put(`http://localhost:5000/api/profiles/${editingProfileId}`, profileData)
        .then(() => {
          fetchProfiles();
          setEditingProfileId(null);
          resetForm();
        })
        .catch(err => console.log(err));
    } else {
      axios.post('http://localhost:5000/api/profiles', profileData)
        .then(() => {
          fetchProfiles();
          resetForm();
        })
        .catch(err => console.log(err));
    }
  };

  const resetForm = () => {
    setProfileData({
      profile_name: '',
      gmail: '',
      gmail_password: '',
      gmail_2fa: '',
      twitter: '',
      twitter_password: '',
      twitter_2fa: '',
      discord: '',
      discord_password: '',
      discord_2fa: '',
      telegram: '',
      phone_number: '',
      sim_card: '',
      galxe: '',
      evm_address: '',
      ton_address: '',
      evm_key: '',
      ton_key: ''
    });
  };

  const handleChangeEditable = (e, profileId) => {
    setEditingProfileData({
      ...editingProfileData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditProfile = (profile) => {
    setEditingProfileId(profile.id);
    setEditingProfileData(profile);
  };

  const handleUpdateProfile = (id) => {
    axios.put(`http://localhost:5000/api/profiles/${id}`, editingProfileData)
      .then(() => {
        fetchProfiles();
        setEditingProfileId(null);
      })
      .catch(err => console.log(err));
  };

  const handleBackupProfile = (profile) => {
    const csvData = [profile];
    const csvFileName = `backup_${profile.profile_name}.csv`;
    return (
      <CSVLink data={csvData} filename={csvFileName}>
        <button className="backup">Backup</button>
      </CSVLink>
    );
  };

  const handleDeleteProfile = (id) => {
    axios.delete(`http://localhost:5000/api/profiles`, { data: { ids: [id] } })
      .then(() => {
        fetchProfiles();
      })
      .catch(err => console.log(err));
  };

  const handleSelectProfile = (id) => {
    if (selectedProfiles.includes(id)) {
      setSelectedProfiles(selectedProfiles.filter(profileId => profileId !== id));
    } else {
      setSelectedProfiles([...selectedProfiles, id]);
    }
  };

  const handleSelectAllProfiles = () => {
    if (selectedProfiles.length === profiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(profiles.map(profile => profile.id));
    }
  };

  const handleDeleteSelectedProfiles = () => {
    axios.delete('http://localhost:5000/api/profiles', { data: { ids: selectedProfiles } })
      .then(() => {
        fetchProfiles();
        setSelectedProfiles([]);
      })
      .catch(err => console.log(err));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
  };

  const sanitize2FAKey = (key) => {
    return key.replace(/\s+/g, '');
  };

  const handleGet2FACode = (secretKey, profileId, service) => {
    if (disabled2FA[`${profileId}-${service}`]) {
      return;
    }

    const sanitizedSecretKey = sanitize2FAKey(secretKey);
    axios.post('http://localhost:5000/api/get-2fa-code', { secretKey: sanitizedSecretKey })
      .then(res => {
        setTwoFACodes({ ...twoFACodes, [`${profileId}-${service}`]: res.data.token });
        setRemainingTimes({ ...remainingTimes, [`${profileId}-${service}`]: res.data.remainingTime });
        setDisabled2FA({ ...disabled2FA, [`${profileId}-${service}`]: true });
        startCountdown(profileId, service, res.data.remainingTime);
      })
      .catch(err => console.log(err));
  };

  const startCountdown = (profileId, service, time) => {
    const intervalId = setInterval(() => {
      setRemainingTimes(prevTimes => {
        const newTime = prevTimes[`${profileId}-${service}`] - 1;
        if (newTime <= 0) {
          clearInterval(intervalId);
          return { ...prevTimes, [`${profileId}-${service}`]: 30 };
        }
        return { ...prevTimes, [`${profileId}-${service}`]: newTime };
      });
    }, 1000);
  };

  const handleToggleKey = (type, profileId) => {
    if (type === 'evm') {
      setShowEVMKey(prevState => ({ ...prevState, [profileId]: !prevState[profileId] }));
    } else if (type === 'ton') {
      setShowTONKey(prevState => ({ ...prevState, [profileId]: !prevState[profileId] }));
    }
  };

  return (
    <div className="container">
      <h1>Wolf Airdrop APM - by Dan Giao Su + ChatGPT</h1>

      {/* Wrapper cho form và nút Add Profile */}
      <div className="profile-form-wrapper">
        <div className="column-1">
          <input type="text" name="profile_name" placeholder="Profile Name" onChange={handleChange} value={profileData.profile_name} />
          <input type="text" name="gmail" placeholder="Gmail" onChange={handleChange} value={profileData.gmail} />
          <input type="password" name="gmail_password" placeholder="Gmail Password" onChange={handleChange} value={profileData.gmail_password} />
          <input type="text" name="gmail_2fa" placeholder="Gmail 2FA Secret" onChange={handleChange} value={profileData.gmail_2fa} />
          <input type="text" name="twitter" placeholder="Twitter" onChange={handleChange} value={profileData.twitter} />
          <input type="password" name="twitter_password" placeholder="Twitter Password" onChange={handleChange} value={profileData.twitter_password} />
          <input type="text" name="twitter_2fa" placeholder="Twitter 2FA Secret" onChange={handleChange} value={profileData.twitter_2fa} />
          <input type="text" name="discord" placeholder="Discord" onChange={handleChange} value={profileData.discord} />
          <input type="password" name="discord_password" placeholder="Discord Password" onChange={handleChange} value={profileData.discord_password} />
          <input type="text" name="discord_2fa" placeholder="Discord 2FA Secret" onChange={handleChange} value={profileData.discord_2fa} />
        </div>

        <div className="column-2">
          <input type="text" name="telegram" placeholder="Telegram" onChange={handleChange} value={profileData.telegram} />
          <input type="text" name="phone_number" placeholder="Phone Number" onChange={handleChange} value={profileData.phone_number} />
          <input type="text" name="sim_card" placeholder="Sim Card" onChange={handleChange} value={profileData.sim_card} />
          <input type="text" name="evm_address" placeholder="EVM Address" onChange={handleChange} value={profileData.evm_address} />
          <input type="password" name="evm_key" placeholder="EVM Key" onChange={handleChange} value={profileData.evm_key} />
          <input type="text" name="ton_address" placeholder="TON Address" onChange={handleChange} value={profileData.ton_address} />
          <input type="password" name="ton_key" placeholder="TON Key" onChange={handleChange} value={profileData.ton_key} />
          <input type="text" name="galxe" placeholder="Galxe" onChange={handleChange} value={profileData.galxe} />
        </div>

        <div className="column-3">
          <button className="add-profile-button" onClick={handleAddOrUpdateProfile}>
            {editingProfileId ? 'Update Profile' : 'Add Profile'}
          </button>
        </div>
      </div>

      {selectedProfiles.length > 0 && (
        <div>
          <CSVLink data={profiles.filter(profile => selectedProfiles.includes(profile.id))} filename="backup_selected_profiles.csv">
            <button>Backup Selected</button>
          </CSVLink>
          <button onClick={handleDeleteSelectedProfiles}>Delete Selected</button>
        </div>
      )}

      {/* Phần hiển thị bảng Profile */}
      <h2>Profiles</h2>
      <table className="profile-table">
        {/* Các cột tiêu đề */}
        <thead>
          <tr>
            <th><input type="checkbox" onChange={handleSelectAllProfiles} checked={selectedProfiles.length === profiles.length} /></th>
            <th>#</th>
            <th>Profile Name</th>
            <th>Gmail</th>
            <th>Gmail Pass</th>
            <th>Gmail 2FA</th>
            <th>Twitter</th>
            <th>Twitter Pass</th>
            <th>Twitter 2FA</th>
            <th>Discord</th>
            <th>Discord Pass</th>
            <th>Discord 2FA</th>
            <th>Phone Number</th>
            <th>Sim Card</th>
            <th>EVM Address</th>
            <th>TON Address</th>
            <th>EVM Key</th>
            <th>TON Key</th>
            <th>Galxe</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map(profile => (
            <tr key={profile.id}>
              <td><input type="checkbox" checked={selectedProfiles.includes(profile.id)} onChange={() => handleSelectProfile(profile.id)} /></td>
              <td>{profile.index}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="profile_name" value={editingProfileData.profile_name} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                profile.profile_name
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="gmail" value={editingProfileData.gmail} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                profile.gmail
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="password" name="gmail_password" value={editingProfileData.gmail_password} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                <button onClick={() => copyToClipboard(profile.gmail_password)}>Copy</button>
              )}</td>
              <td>
                {editingProfileId === profile.id ? (
                  <input type="text" name="gmail_2fa" value={editingProfileData.gmail_2fa} onChange={(e) => handleChangeEditable(e, profile.id)} />
                ) : (
                  <>
                    {!disabled2FA[`${profile.id}-gmail`] ? (
                      <button onClick={() => handleGet2FACode(profile.gmail_2fa, profile.id, 'gmail')}>Get 2FA</button>
                    ) : (
                      <>
                        {twoFACodes[`${profile.id}-gmail`] && (
                          <div>
                            <p>Mã 2FA: {twoFACodes[`${profile.id}-gmail`]}</p>
                            <button onClick={() => copyToClipboard(twoFACodes[`${profile.id}-gmail`])}>
                              Copy OTP
                            </button>
                            <p>Thời gian còn lại: {remainingTimes[`${profile.id}-gmail`]} giây</p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="twitter" value={editingProfileData.twitter} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                profile.twitter
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="password" name="twitter_password" value={editingProfileData.twitter_password} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                <button onClick={() => copyToClipboard(profile.twitter_password)}>Copy</button>
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="twitter_2fa" value={editingProfileData.twitter_2fa} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                <>
                  {!disabled2FA[`${profile.id}-twitter`] ? (
                    <button onClick={() => handleGet2FACode(profile.twitter_2fa, profile.id, 'twitter')}>Get 2FA</button>
                  ) : (
                    <>
                      {twoFACodes[`${profile.id}-twitter`] && (
                        <div>
                          <p>Mã 2FA: {twoFACodes[`${profile.id}-twitter`]}</p>
                          <button onClick={() => copyToClipboard(twoFACodes[`${profile.id}-twitter`])}>
                            Copy OTP
                          </button>
                          <p>Thời gian còn lại: {remainingTimes[`${profile.id}-twitter`]} giây</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="discord" value={editingProfileData.discord} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                profile.discord
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="password" name="discord_password" value={editingProfileData.discord_password} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                <button onClick={() => copyToClipboard(profile.discord_password)}>Copy</button>
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="discord_2fa" value={editingProfileData.discord_2fa} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                <>
                  {!disabled2FA[`${profile.id}-discord`] ? (
                    <button onClick={() => handleGet2FACode(profile.discord_2fa, profile.id, 'discord')}>Get 2FA</button>
                  ) : (
                    <>
                      {twoFACodes[`${profile.id}-discord`] && (
                        <div>
                          <p>Mã 2FA: {twoFACodes[`${profile.id}-discord`]}</p>
                          <button onClick={() => copyToClipboard(twoFACodes[`${profile.id}-discord`])}>
                            Copy OTP
                          </button>
                          <p>Thời gian còn lại: {remainingTimes[`${profile.id}-discord`]} giây</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="phone_number" value={editingProfileData.phone_number} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                profile.phone_number
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="sim_card" value={editingProfileData.sim_card} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                profile.sim_card
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="evm_address" value={editingProfileData.evm_address} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                profile.evm_address
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="ton_address" value={editingProfileData.ton_address} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                profile.ton_address
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="password" name="evm_key" value={editingProfileData.evm_key} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                <>
                  {!showEVMKey[profile.id] ? (
                    <button onClick={() => handleToggleKey('evm', profile.id)}>Show EVM Key</button>
                  ) : (
                    <>
                      <p>{profile.evm_key}</p>
                      <button onClick={() => copyToClipboard(profile.evm_key)}>Copy EVM Key</button>
                      <button onClick={() => handleToggleKey('evm', profile.id)}>Hide EVM Key</button>
                    </>
                  )}
                </>
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="password" name="ton_key" value={editingProfileData.ton_key} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                <>
                  {!showTONKey[profile.id] ? (
                    <button onClick={() => handleToggleKey('ton', profile.id)}>Show TON Key</button>
                  ) : (
                    <>
                      <p>{profile.ton_key}</p>
                      <button onClick={() => copyToClipboard(profile.ton_key)}>Copy TON Key</button>
                      <button onClick={() => handleToggleKey('ton', profile.id)}>Hide TON Key</button>
                    </>
                  )}
                </>
              )}</td>
              <td>{editingProfileId === profile.id ? (
                <input type="text" name="galxe" value={editingProfileData.galxe} onChange={(e) => handleChangeEditable(e, profile.id)} />
              ) : (
                profile.galxe
              )}</td>
              <td>
                {editingProfileId === profile.id ? (
                  <>
                    <button className="update" onClick={() => handleUpdateProfile(profile.id)}>Update</button>
                    <button className="cancel" onClick={handleCancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="edit" onClick={() => handleEditProfile(profile)}>Edit</button>
                    <button className="delete" onClick={() => handleDeleteProfile(profile.id)}>Delete</button>
                    {handleBackupProfile(profile)}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
