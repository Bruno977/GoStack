import React, { Component } from "react";
import api from "../../services/api";
// import { Container } from './styles';

export default class Repository extends Component {
    async componentDidMount() {
        const { match } = this.props;

        const repoName = decodeURIComponent(match.params.repository);

        const [repository, issues] = await Promise.all([
            api.get(`/repos/${repoName}`),
            api.get(`/repos/${repoName}/issues`),
            {
                params: {
                    state: "open",
                    per_page: 5,
                },
            },
        ]);

        this.setState({
            repository: repository.data,
            issues: issues.data,
            loading: false,
        });
    }
    render() {
        const { repository, issues, loading } = this.state;
        <h1>Repository</h1>;
    }
}
